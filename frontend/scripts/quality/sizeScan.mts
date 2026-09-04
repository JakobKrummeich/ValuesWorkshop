export const RepositoryArea = {
  Backend: "backend",
  FrontendSource: "frontend/src",
  EndToEnd: "e2e",
  Scripts: "scripts",
  Contract: "contract",
  Design: "design",
  Docs: "docs",
  Tasks: "tasks",
  Other: "other",
} as const;

export type RepositoryArea =
  (typeof RepositoryArea)[keyof typeof RepositoryArea];

export const RepositorySide = {
  Backend: "backend",
  Frontend: "frontend",
} as const;

export type RepositorySide =
  (typeof RepositorySide)[keyof typeof RepositorySide];

export const SourceKind = {
  Production: "production",
  Test: "test",
} as const;

export type SourceKind = (typeof SourceKind)[keyof typeof SourceKind];

export interface MeasuredFile {
  path: string;
  lineCount: number;
}

export interface AreaSize {
  area: RepositoryArea;
  files: number;
  productionLines: number;
  testLines: number;
  totalLines: number;
}

export interface ExtensionCount {
  extension: string;
  files: number;
}

export interface LongestFile {
  side: RepositorySide;
  kind: SourceKind;
  path: string;
  lineCount: number;
}

export interface SizeMetrics {
  files: number;
  productionLines: number;
  testLines: number;
  totalLines: number;
  areas: AreaSize[];
  filesByExtension: ExtensionCount[];
  longestFiles: LongestFile[];
}

const areaPrefixes: readonly (readonly [RepositoryArea, readonly string[]])[] =
  [
    [RepositoryArea.FrontendSource, ["frontend/src/"]],
    [RepositoryArea.Scripts, ["scripts/", "frontend/scripts/", "devtools/"]],
    [RepositoryArea.Backend, ["backend/"]],
    [RepositoryArea.EndToEnd, ["e2e/"]],
    [RepositoryArea.Contract, ["contract/"]],
    [RepositoryArea.Design, ["design/"]],
    [RepositoryArea.Docs, ["docs/"]],
    [RepositoryArea.Tasks, ["tasks/"]],
  ];

const testPathPatterns: readonly RegExp[] = [
  /(^|\/)[^/]+\.Tests\//,
  /(^|\/)__tests__\//,
  /\.test\.[^/]+$/,
  /\.spec\.[^/]+$/,
  /^e2e\//,
  /TestSupport/,
];

const binaryExtensions: ReadonlySet<string> = new Set([
  "db",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "mp4",
  "otf",
  "pdf",
  "png",
  "ttf",
  "webm",
  "webp",
  "woff",
  "woff2",
  "zip",
]);

const generatedPathPatterns: readonly RegExp[] = [
  /^docs\/quality\//,
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json)$/,
  /(^|\/)Migrations\//,
  /^frontend\/src\/domain\/phases\.ts$/,
];

export function extensionOf(path: string): string {
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.slice(lastDot + 1) : "none";
}

export function isMeasuredPath(path: string): boolean {
  return (
    !generatedPathPatterns.some((pattern) => pattern.test(path)) &&
    !binaryExtensions.has(extensionOf(path))
  );
}

export function areaOf(path: string): RepositoryArea {
  const match = areaPrefixes.find(([, prefixes]) =>
    prefixes.some((prefix) => path.startsWith(prefix)),
  );
  return match ? match[0] : RepositoryArea.Other;
}

export function sourceKindOf(path: string): SourceKind {
  return testPathPatterns.some((pattern) => pattern.test(path))
    ? SourceKind.Test
    : SourceKind.Production;
}

function sideOf(path: string): RepositorySide | undefined {
  if (path.startsWith("backend/")) {
    return RepositorySide.Backend;
  }
  return path.startsWith("frontend/") ? RepositorySide.Frontend : undefined;
}

export function parseTrackedFilePaths(gitListOutput: string): string[] {
  return gitListOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function countLines(fileContent: string): number {
  if (fileContent.length === 0) {
    return 0;
  }
  const lines = fileContent.split("\n");
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
}

function emptyArea(area: RepositoryArea): AreaSize {
  return { area, files: 0, productionLines: 0, testLines: 0, totalLines: 0 };
}

function areaSizes(files: MeasuredFile[]): AreaSize[] {
  const byArea = new Map<RepositoryArea, AreaSize>();
  for (const file of files) {
    const area = areaOf(file.path);
    const size = byArea.get(area) ?? emptyArea(area);
    size.files += 1;
    size.totalLines += file.lineCount;
    if (sourceKindOf(file.path) === SourceKind.Test) {
      size.testLines += file.lineCount;
    } else {
      size.productionLines += file.lineCount;
    }
    byArea.set(area, size);
  }
  return [...byArea.values()].sort((left, right) =>
    left.area.localeCompare(right.area),
  );
}

function extensionCounts(files: MeasuredFile[]): ExtensionCount[] {
  const byExtension = new Map<string, number>();
  for (const file of files) {
    const extension = extensionOf(file.path);
    byExtension.set(extension, (byExtension.get(extension) ?? 0) + 1);
  }
  return [...byExtension.entries()]
    .map(([extension, count]) => ({ extension, files: count }))
    .sort(
      (left, right) =>
        right.files - left.files ||
        left.extension.localeCompare(right.extension),
    );
}

function longestFiles(files: MeasuredFile[]): LongestFile[] {
  const combinations = [
    [RepositorySide.Backend, SourceKind.Production],
    [RepositorySide.Backend, SourceKind.Test],
    [RepositorySide.Frontend, SourceKind.Production],
    [RepositorySide.Frontend, SourceKind.Test],
  ] as const;
  return combinations.flatMap(([side, kind]) => {
    const longest = files
      .filter(
        (file) =>
          sideOf(file.path) === side && sourceKindOf(file.path) === kind,
      )
      .sort(
        (left, right) =>
          right.lineCount - left.lineCount ||
          left.path.localeCompare(right.path),
      )[0];
    return longest
      ? [{ side, kind, path: longest.path, lineCount: longest.lineCount }]
      : [];
  });
}

export function summarizeSize(files: MeasuredFile[]): SizeMetrics {
  const areas = areaSizes(files);
  return {
    files: files.length,
    productionLines: areas.reduce((sum, area) => sum + area.productionLines, 0),
    testLines: areas.reduce((sum, area) => sum + area.testLines, 0),
    totalLines: areas.reduce((sum, area) => sum + area.totalLines, 0),
    areas,
    filesByExtension: extensionCounts(files),
    longestFiles: longestFiles(files),
  };
}
