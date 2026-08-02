import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkedInPhasesModulePath,
  parsePhaseEnumMembers,
  phaseEnumSourcePath,
  renderPhasesModule,
  renderPhasesModuleDiff,
} from "../phaseEnumCodegen.mts";
import { runPhaseEnumCodegen } from "../generatePhasesModule.mts";

const csharpSource = `namespace ValuesWorkshop.Domain;

public enum Phase
{
    Join = 1,
    Quiz = 2,
    FinalPresentation = 3,
}
`;

const generatedModule = renderPhasesModule(parsePhaseEnumMembers(csharpSource));

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
    expect(generatedModule).toBe(
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

describe("renderPhasesModuleDiff", () => {
  it("is empty for two identical modules", () => {
    expect(renderPhasesModuleDiff(generatedModule, generatedModule)).toEqual(
      [],
    );
  });

  it("shows the checked-in line and the generated line of every change", () => {
    const renumbered = generatedModule.replace("Quiz = 2", "Quiz = 7");

    expect(renderPhasesModuleDiff(generatedModule, renumbered)).toEqual([
      "-   Quiz = 7,",
      "+   Quiz = 2,",
    ]);
  });

  it("shows a checked-in line that the generated module does not have", () => {
    const added = generatedModule.replace("}\n", "  Retrospective = 4,\n}\n");

    expect(renderPhasesModuleDiff(generatedModule, added)).toEqual([
      "-   Retrospective = 4,",
      "+ }",
      "- }",
      "+ ",
      "- ",
    ]);
  });

  it("shows a generated line that the checked-in module lacks", () => {
    const removed = generatedModule.replace("  Quiz = 2,\n", "");

    expect(renderPhasesModuleDiff(generatedModule, removed)).toEqual([
      "-   FinalPresentation = 3,",
      "+   Quiz = 2,",
      "- }",
      "+   FinalPresentation = 3,",
      "- ",
      "+ }",
      "+ ",
    ]);
  });
});

describe("runPhaseEnumCodegen", () => {
  let directory = "";
  let files = { csharpFile: "", typescriptFile: "" };

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "phase-enum-codegen-"));
    files = {
      csharpFile: join(directory, "Phase.cs"),
      typescriptFile: join(directory, "phases.ts"),
    };
    writeFileSync(files.csharpFile, csharpSource);
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("accepts a checked-in module that matches the C# enum", () => {
    writeFileSync(files.typescriptFile, generatedModule);

    expect(runPhaseEnumCodegen("--check", files)).toEqual({
      exitCode: 0,
      report: `${checkedInPhasesModulePath} is in sync with ${phaseEnumSourcePath}`,
    });
  });

  it("reports a drifted module as a diff with the command that fixes it", () => {
    writeFileSync(
      files.typescriptFile,
      generatedModule.replace("Quiz = 2", "Quiz = 7"),
    );

    const outcome = runPhaseEnumCodegen("--check", files);

    expect(outcome.exitCode).toBe(1);
    expect(outcome.report).toBe(
      [
        `${checkedInPhasesModulePath} is out of sync with ${phaseEnumSourcePath}:`,
        "-   Quiz = 7,",
        "+   Quiz = 2,",
        "Run `pnpm --dir frontend phases:generate` and commit the result.",
      ].join("\n"),
    );
  });

  it("writes the generated module over the checked-in one", () => {
    writeFileSync(files.typescriptFile, "export const phase = 1;\n");

    expect(runPhaseEnumCodegen("--write", files)).toEqual({
      exitCode: 0,
      report: `Wrote ${checkedInPhasesModulePath} from ${phaseEnumSourcePath}`,
    });
    expect(readFileSync(files.typescriptFile, "utf8")).toBe(generatedModule);
  });

  it("reports a C# parse failure instead of a drift diff", () => {
    writeFileSync(files.csharpFile, "public enum Role { Facilitator = 1 }");
    writeFileSync(files.typescriptFile, generatedModule);

    const outcome = runPhaseEnumCodegen("--check", files);

    expect(outcome.exitCode).toBe(1);
    expect(outcome.report).toBe(
      `${phaseEnumSourcePath}: no "enum Phase" declaration found`,
    );
  });

  it("reports an unreadable C# file", () => {
    rmSync(files.csharpFile);

    expect(runPhaseEnumCodegen("--check", files).exitCode).toBe(1);
  });

  it("prints its usage for an unknown mode", () => {
    expect(runPhaseEnumCodegen("--verify", files)).toEqual({
      exitCode: 1,
      report: "Usage: node scripts/generatePhasesModule.mts --check|--write",
    });
  });
});
