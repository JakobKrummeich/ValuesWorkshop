export interface PhaseEnumMember {
  name: string;
  value: number;
}

export const phaseEnumSourcePath = "backend/Domain/Phase.cs";
export const checkedInPhasesModulePath = "frontend/src/domain/phases.ts";

const csharpEnumBodyPattern = /\benum\s+Phase\b[^{]*\{([^}]*)\}/;
const typescriptEnumBodyPattern = /\bexport\s+enum\s+Phase\s*\{([^}]*)\}/;
const memberDeclarationPattern = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(-?\d+)$/;

function splitMemberDeclarations(enumBody: string): string[] {
  return enumBody
    .split(/[,\n]/)
    .map((declaration) => declaration.trim())
    .filter(
      (declaration) => declaration !== "" && !declaration.startsWith("//"),
    );
}

function parseMemberDeclaration(
  declaration: string,
  sourcePath: string,
): PhaseEnumMember {
  const match = memberDeclarationPattern.exec(declaration);
  if (!match) {
    throw new Error(
      `${sourcePath}: cannot parse enum member declaration "${declaration}"`,
    );
  }
  return { name: match[1], value: Number(match[2]) };
}

function assertMembersAreUnique(members: PhaseEnumMember[]): void {
  const seenNames = new Set<string>();
  const seenValues = new Set<number>();
  for (const member of members) {
    if (seenNames.has(member.name)) {
      throw new Error(
        `${phaseEnumSourcePath}: enum Phase declares the member "${member.name}" more than once`,
      );
    }
    if (seenValues.has(member.value)) {
      throw new Error(
        `${phaseEnumSourcePath}: enum Phase declares the value ${member.value} more than once`,
      );
    }
    seenNames.add(member.name);
    seenValues.add(member.value);
  }
}

export function parsePhaseEnumMembers(csharpSource: string): PhaseEnumMember[] {
  const bodyMatch = csharpEnumBodyPattern.exec(csharpSource);
  if (!bodyMatch) {
    throw new Error(
      `${phaseEnumSourcePath}: no "enum Phase" declaration found`,
    );
  }
  const members = splitMemberDeclarations(bodyMatch[1]).map((declaration) =>
    parseMemberDeclaration(declaration, phaseEnumSourcePath),
  );
  if (members.length === 0) {
    throw new Error(`${phaseEnumSourcePath}: enum Phase declares no members`);
  }
  assertMembersAreUnique(members);
  return members;
}

export function renderPhasesModule(members: PhaseEnumMember[]): string {
  const memberLines = members
    .map((member) => `  ${member.name} = ${member.value},`)
    .join("\n");
  return `// Generated from ${phaseEnumSourcePath} — do not edit by hand.
// Run \`pnpm --dir frontend phases:generate\` after changing the C# enum.

export enum Phase {
${memberLines}
}
`;
}

type CheckedInParse =
  { members: PhaseEnumMember[] } | { unreadableReason: string };

function parseCheckedInMembers(typescriptSource: string): CheckedInParse {
  const bodyMatch = typescriptEnumBodyPattern.exec(typescriptSource);
  if (!bodyMatch) {
    return {
      unreadableReason: `${checkedInPhasesModulePath} does not declare "export enum Phase"`,
    };
  }
  const declarations = splitMemberDeclarations(bodyMatch[1]);
  const unparseableDeclaration = declarations.find(
    (declaration) => !memberDeclarationPattern.test(declaration),
  );
  if (unparseableDeclaration !== undefined) {
    return {
      unreadableReason: `${checkedInPhasesModulePath}: cannot parse enum member declaration "${unparseableDeclaration}"`,
    };
  }
  return {
    members: declarations.map((declaration) =>
      parseMemberDeclaration(declaration, checkedInPhasesModulePath),
    ),
  };
}

function compareMembers(
  expectedMembers: PhaseEnumMember[],
  checkedInMembers: PhaseEnumMember[],
): string[] {
  const checkedInByName = new Map(
    checkedInMembers.map((member) => [member.name, member.value]),
  );
  const expectedNames = new Set(expectedMembers.map((member) => member.name));

  const expectedDrift = expectedMembers.flatMap((member) => {
    const checkedInValue = checkedInByName.get(member.name);
    if (checkedInValue === undefined) {
      return [
        `Phase member "${member.name}" (value ${member.value}) is missing from ${checkedInPhasesModulePath}`,
      ];
    }
    if (checkedInValue !== member.value) {
      return [
        `Phase member "${member.name}" is ${checkedInValue} in ${checkedInPhasesModulePath} but ${member.value} in ${phaseEnumSourcePath}`,
      ];
    }
    return [];
  });

  const unexpectedDrift = checkedInMembers
    .filter((member) => !expectedNames.has(member.name))
    .map(
      (member) =>
        `Phase member "${member.name}" in ${checkedInPhasesModulePath} does not exist in ${phaseEnumSourcePath}`,
    );

  return [...expectedDrift, ...unexpectedDrift];
}

export function findPhaseEnumDrift(
  csharpSource: string,
  typescriptSource: string,
): string[] {
  const expectedMembers = parsePhaseEnumMembers(csharpSource);
  if (typescriptSource === renderPhasesModule(expectedMembers)) {
    return [];
  }
  const checkedIn = parseCheckedInMembers(typescriptSource);
  if ("unreadableReason" in checkedIn) {
    return [checkedIn.unreadableReason];
  }
  const memberDrift = compareMembers(expectedMembers, checkedIn.members);
  if (memberDrift.length > 0) {
    return memberDrift;
  }
  return [`${checkedInPhasesModulePath} differs from the generated output`];
}
