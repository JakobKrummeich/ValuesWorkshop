import { parse } from "yaml";
import { z } from "zod";

export type PackageId = string;

export interface LockfileGraph {
  roots: PackageId[];
  edges: ReadonlyMap<PackageId, readonly PackageId[]>;
}

const resolvedVersionsSchema = z.record(z.string(), z.string());

const snapshotSchema = z.looseObject({
  dependencies: resolvedVersionsSchema.optional(),
  optionalDependencies: resolvedVersionsSchema.optional(),
});

const importerSchema = z.looseObject({
  dependencies: z
    .record(z.string(), z.looseObject({ version: z.string() }))
    .optional(),
});

const lockfileSchema = z.looseObject({
  importers: z.record(z.string(), importerSchema),
  snapshots: z.record(z.string(), snapshotSchema),
});

type Lockfile = z.infer<typeof lockfileSchema>;
type Snapshot = z.infer<typeof snapshotSchema>;

interface ResolvedDependency {
  name: string;
  resolvedVersion: string;
}

function parseLockfile(lockfileYaml: string): Lockfile {
  const parsed = lockfileSchema.safeParse(parse(lockfileYaml));
  if (!parsed.success) {
    throw new Error(
      `pnpm-lock.yaml is not a pnpm lockfile this reader understands: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

function packageIdOf({ name, resolvedVersion }: ResolvedDependency): PackageId {
  const peerSuffixStart = resolvedVersion.indexOf("(");
  const version =
    peerSuffixStart < 0
      ? resolvedVersion
      : resolvedVersion.slice(0, peerSuffixStart);
  return `${name}@${version}`;
}

function snapshotKeyOf({ name, resolvedVersion }: ResolvedDependency): string {
  return `${name}@${resolvedVersion}`;
}

function productionDependenciesOf(
  lockfile: Lockfile,
  importer: string,
): ResolvedDependency[] {
  const entry = lockfile.importers[importer];
  if (entry === undefined) {
    throw new Error(`pnpm-lock.yaml has no importer "${importer}".`);
  }
  return Object.entries(entry.dependencies ?? {}).map(
    ([name, { version }]) => ({
      name,
      resolvedVersion: version,
    }),
  );
}

function resolvedDependenciesOf(snapshot: Snapshot): ResolvedDependency[] {
  return Object.entries({
    ...snapshot.dependencies,
    ...snapshot.optionalDependencies,
  }).map(([name, resolvedVersion]) => ({ name, resolvedVersion }));
}

function snapshotOf(
  lockfile: Lockfile,
  key: string,
  dependent: string,
): Snapshot {
  const snapshot = lockfile.snapshots[key];
  if (snapshot === undefined) {
    throw new Error(
      `pnpm-lock.yaml has no snapshot "${key}", which ${dependent} depends on.`,
    );
  }
  return snapshot;
}

export function parseLockfileGraph(
  lockfileYaml: string,
  importer: string,
): LockfileGraph {
  const lockfile = parseLockfile(lockfileYaml);
  const visitedSnapshots = new Set<string>();
  const targetsBySource = new Map<PackageId, Set<PackageId>>();
  const visit = (dependency: ResolvedDependency, dependent: string): void => {
    const key = snapshotKeyOf(dependency);
    if (visitedSnapshots.has(key)) {
      return;
    }
    visitedSnapshots.add(key);
    const source = packageIdOf(dependency);
    const targets = targetsBySource.get(source) ?? new Set<PackageId>();
    targetsBySource.set(source, targets);
    for (const target of resolvedDependenciesOf(
      snapshotOf(lockfile, key, dependent),
    )) {
      targets.add(packageIdOf(target));
      visit(target, key);
    }
  };
  const roots = productionDependenciesOf(lockfile, importer);
  for (const root of roots) {
    visit(root, `importer "${importer}"`);
  }
  return {
    roots: roots.map(packageIdOf),
    edges: new Map(
      [...targetsBySource].map(([source, targets]) => [
        source,
        [...targets].sort(),
      ]),
    ),
  };
}
