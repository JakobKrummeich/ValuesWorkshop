export interface TokenFileSummary {
  path: string;
  customProperties: number;
}

export interface DesignSystemMetrics {
  customProperties: number;
  tokenFiles: TokenFileSummary[];
  cssModules: number;
  contrastAssertions: number;
}

const customPropertyDeclaration = /(?:^|[;{])\s*(--[A-Za-z0-9-]+)\s*:/gm;

export function parseDefinedCustomProperties(styleSheet: string): string[] {
  const names = [...styleSheet.matchAll(customPropertyDeclaration)].map(
    (match) => match[1],
  );
  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

export function countCssModules(trackedPaths: readonly string[]): number {
  return trackedPaths.filter(
    (path) => path.startsWith("frontend/src/") && path.endsWith(".module.css"),
  ).length;
}

export function summarizeDesignSystem(
  tokenStyleSheets: readonly { path: string; content: string }[],
  trackedPaths: readonly string[],
  contrastAssertions: number,
): DesignSystemMetrics {
  const perFile = tokenStyleSheets.map((styleSheet) => ({
    path: styleSheet.path,
    properties: parseDefinedCustomProperties(styleSheet.content),
  }));
  const distinct = new Set(perFile.flatMap((file) => file.properties));
  return {
    customProperties: distinct.size,
    tokenFiles: perFile.map((file) => ({
      path: file.path,
      customProperties: file.properties.length,
    })),
    cssModules: countCssModules(trackedPaths),
    contrastAssertions,
  };
}
