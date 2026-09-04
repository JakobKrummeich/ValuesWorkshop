const testMethodDeclaration =
  /\[(?:Fact|Theory)\][\s\S]{0,400}?public\s+(?:async\s+Task|void)\s+([A-Za-z0-9_]+)\s*\(/g;

export function parseTestMethodNames(source: string): string[] {
  return [...source.matchAll(testMethodDeclaration)].map((match) => match[1]);
}
