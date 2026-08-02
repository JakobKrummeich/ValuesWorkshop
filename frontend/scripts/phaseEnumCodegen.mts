export interface PhaseEnumMember {
  name: string;
  value: number;
}

export const phaseEnumSourcePath = "backend/Domain/Phase.cs";
export const checkedInPhasesModulePath = "frontend/src/domain/phases.ts";

const csharpEnumBodyPattern = /\benum\s+Phase\b[^{]*\{([^}]*)\}/;
const memberDeclarationPattern = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(-?\d+)$/;

function splitMemberDeclarations(enumBody: string): string[] {
  return enumBody
    .split(/[,\n]/)
    .map((declaration) => declaration.trim())
    .filter(
      (declaration) => declaration !== "" && !declaration.startsWith("//"),
    );
}

function parseMemberDeclaration(declaration: string): PhaseEnumMember {
  const match = memberDeclarationPattern.exec(declaration);
  if (!match) {
    throw new Error(
      `${phaseEnumSourcePath}: cannot parse enum member declaration "${declaration}"`,
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
  const members = splitMemberDeclarations(bodyMatch[1]).map(
    parseMemberDeclaration,
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

export function renderPhasesModuleDiff(
  generatedModule: string,
  checkedInModule: string,
): string[] {
  const generatedLines = generatedModule.split("\n");
  const checkedInLines = checkedInModule.split("\n");
  const lineCount = Math.max(generatedLines.length, checkedInLines.length);

  return Array.from({ length: lineCount }, (unusedValue, index) => index)
    .filter((index) => generatedLines[index] !== checkedInLines[index])
    .flatMap((index) => [
      ...(checkedInLines[index] === undefined
        ? []
        : [`- ${checkedInLines[index]}`]),
      ...(generatedLines[index] === undefined
        ? []
        : [`+ ${generatedLines[index]}`]),
    ]);
}
