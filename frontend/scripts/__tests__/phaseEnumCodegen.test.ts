import {
  checkedInPhasesModulePath,
  findPhaseEnumDrift,
  parsePhaseEnumMembers,
  phaseEnumSourcePath,
  renderPhasesModule,
} from "../phaseEnumCodegen";

const csharpSource = `namespace ValuesWorkshop.Domain;

public enum Phase
{
    Join = 1,
    Quiz = 2,
    FinalPresentation = 3,
}
`;

describe("parsePhaseEnumMembers", () => {
  it("reads every member name with its explicit value", () => {
    expect(parsePhaseEnumMembers(csharpSource)).toEqual([
      { name: "Join", value: 1 },
      { name: "Quiz", value: 2 },
      { name: "FinalPresentation", value: 3 },
    ]);
  });

  it("ignores comment lines inside the enum body", () => {
    const commentedSource = `public enum Phase
{
    // the workshop starts here
    Join = 1,
}
`;

    expect(parsePhaseEnumMembers(commentedSource)).toEqual([
      { name: "Join", value: 1 },
    ]);
  });

  it("fails when the file declares no Phase enum", () => {
    expect(() =>
      parsePhaseEnumMembers("public enum Role { Facilitator = 1 }"),
    ).toThrow(phaseEnumSourcePath);
  });

  it("fails when the enum body is empty", () => {
    expect(() => parsePhaseEnumMembers("public enum Phase\n{\n}\n")).toThrow(
      "declares no members",
    );
  });

  it("fails when a member has no explicit value", () => {
    expect(() =>
      parsePhaseEnumMembers("public enum Phase\n{\n    Join,\n}\n"),
    ).toThrow('cannot parse enum member declaration "Join"');
  });

  it("fails when a member name repeats", () => {
    expect(() =>
      parsePhaseEnumMembers(
        "public enum Phase\n{\n Join = 1,\n Join = 2,\n}\n",
      ),
    ).toThrow('declares the member "Join" more than once');
  });

  it("fails when two members share a value", () => {
    expect(() =>
      parsePhaseEnumMembers(
        "public enum Phase\n{\n Join = 1,\n Quiz = 1,\n}\n",
      ),
    ).toThrow("declares the value 1 more than once");
  });
});

describe("renderPhasesModule", () => {
  it("emits a generated TypeScript enum with a do-not-edit header", () => {
    expect(renderPhasesModule(parsePhaseEnumMembers(csharpSource))).toBe(
      `// Generated from ${phaseEnumSourcePath} — do not edit by hand.
// Run \`pnpm --dir frontend phases:generate\` after changing the C# enum.

export enum Phase {
  Join = 1,
  Quiz = 2,
  FinalPresentation = 3,
}
`,
    );
  });
});

describe("findPhaseEnumDrift", () => {
  const generatedSource = renderPhasesModule(
    parsePhaseEnumMembers(csharpSource),
  );

  it("reports no drift when the checked-in module matches", () => {
    expect(findPhaseEnumDrift(csharpSource, generatedSource)).toEqual([]);
  });

  it("names a renamed member as both missing and unexpected", () => {
    const renamed = generatedSource.replace("Quiz = 2", "QuizRound = 2");

    expect(findPhaseEnumDrift(csharpSource, renamed)).toEqual([
      `Phase member "Quiz" (value 2) is missing from ${checkedInPhasesModulePath}`,
      `Phase member "QuizRound" in ${checkedInPhasesModulePath} does not exist in ${phaseEnumSourcePath}`,
    ]);
  });

  it("names a member that only the C# enum declares", () => {
    const removed = generatedSource.replace("  Quiz = 2,\n", "");

    expect(findPhaseEnumDrift(csharpSource, removed)).toEqual([
      `Phase member "Quiz" (value 2) is missing from ${checkedInPhasesModulePath}`,
    ]);
  });

  it("names a member that only the TypeScript module declares", () => {
    const added = generatedSource.replace("}\n", "  Retrospective = 4,\n}\n");

    expect(findPhaseEnumDrift(csharpSource, added)).toEqual([
      `Phase member "Retrospective" in ${checkedInPhasesModulePath} does not exist in ${phaseEnumSourcePath}`,
    ]);
  });

  it("names a member whose number was changed", () => {
    const renumbered = generatedSource.replace("Quiz = 2", "Quiz = 7");

    expect(findPhaseEnumDrift(csharpSource, renumbered)).toEqual([
      `Phase member "Quiz" is 7 in ${checkedInPhasesModulePath} but 2 in ${phaseEnumSourcePath}`,
    ]);
  });

  it("reports the file itself when only its surrounding text drifted", () => {
    const editedHeader = generatedSource.replace(
      "// Generated from",
      "// hand edited from",
    );

    expect(findPhaseEnumDrift(csharpSource, editedHeader)).toEqual([
      `${checkedInPhasesModulePath} differs from the generated output`,
    ]);
  });

  it("reports a checked-in module that declares no Phase enum at all", () => {
    expect(
      findPhaseEnumDrift(csharpSource, "export const phase = 1;\n"),
    ).toEqual([
      `${checkedInPhasesModulePath} does not declare "export enum Phase"`,
    ]);
  });

  it("reports an unparseable member in the checked-in module against its own path", () => {
    const withoutValue = generatedSource.replace("Quiz = 2,", "Quiz,");

    expect(findPhaseEnumDrift(csharpSource, withoutValue)).toEqual([
      `${checkedInPhasesModulePath}: cannot parse enum member declaration "Quiz"`,
    ]);
  });

  it("propagates a C# parse failure instead of reporting drift", () => {
    expect(() => findPhaseEnumDrift("nothing here", generatedSource)).toThrow(
      phaseEnumSourcePath,
    );
  });
});
