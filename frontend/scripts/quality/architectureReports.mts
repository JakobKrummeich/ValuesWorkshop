import { z } from "zod";

export interface ModuleGraphMetrics {
  modules: number;
  dependencies: number;
  rules: number;
  violations: number;
  circularDependencies: number;
}

export interface FolderInstability {
  folder: string;
  afferentCouplings: number;
  efferentCouplings: number;
  instability: number;
}

const moduleGraphSchema = z.object({
  summary: z.object({
    totalCruised: z.number(),
    totalDependenciesCruised: z.number(),
    error: z.number(),
    warn: z.number(),
    violations: z.array(z.object({ rule: z.object({ name: z.string() }) })),
    ruleSetUsed: z.object({
      forbidden: z.array(z.object({ name: z.string() })),
    }),
  }),
  modules: z.array(
    z.object({
      source: z.string(),
      dependencies: z.array(z.object({ circular: z.boolean().optional() })),
    }),
  ),
});

const folderListSchema = z.object({
  folders: z.array(z.looseObject({ name: z.string() })),
});

const measuredFolderSchema = z.object({
  afferentCouplings: z.number(),
  efferentCouplings: z.number(),
  instability: z.number(),
});

export function parseModuleGraph(reportJson: string): ModuleGraphMetrics {
  const report = moduleGraphSchema.parse(JSON.parse(reportJson));
  return {
    modules: report.summary.totalCruised,
    dependencies: report.summary.totalDependenciesCruised,
    rules: report.summary.ruleSetUsed.forbidden.length,
    violations: report.summary.violations.length,
    circularDependencies: report.modules.filter((module) =>
      module.dependencies.some((dependency) => dependency.circular === true),
    ).length,
  };
}

export function parseFolderInstability(
  metricsJson: string,
  folders: readonly string[],
): FolderInstability[] {
  const report = folderListSchema.parse(JSON.parse(metricsJson));
  return folders.map((folder) => {
    const entry = report.folders.find((candidate) => candidate.name === folder);
    if (!entry) {
      throw new Error(
        `dependency-cruiser reported no metrics for the folder ${folder}.`,
      );
    }
    const measured = measuredFolderSchema.parse(entry);
    return {
      folder,
      afferentCouplings: measured.afferentCouplings,
      efferentCouplings: measured.efferentCouplings,
      instability: Math.round(measured.instability * 100) / 100,
    };
  });
}

export function readableRuleName(methodName: string): string {
  return methodName.replaceAll("_", " ");
}
