import {
  orderedDependencies,
  type BillOfMaterials,
} from "./billsOfMaterials.mts";
import type { LockfileGraph, PackageId } from "./lockfileDependencyGraph.mts";

const npmPackageUrlPrefix = "pkg:npm/";

type ReferencesById = ReadonlyMap<PackageId, string>;

function packageIdOf(reference: string): PackageId {
  if (!reference.startsWith(npmPackageUrlPrefix)) {
    throw new Error(
      `The component reference "${reference}" is not an npm package URL.`,
    );
  }
  return decodeURIComponent(reference.slice(npmPackageUrlPrefix.length));
}

function referencesById(bill: BillOfMaterials): ReferencesById {
  return new Map(
    bill.components.map((component) => [
      packageIdOf(component["bom-ref"]),
      component["bom-ref"],
    ]),
  );
}

function packagesOf(graph: LockfileGraph): ReadonlySet<PackageId> {
  return new Set([
    ...graph.roots,
    ...[...graph.edges].flatMap(([source, targets]) => [source, ...targets]),
  ]);
}

function assertSamePackages(
  listed: ReferencesById,
  reached: ReadonlySet<PackageId>,
): void {
  const onlyListed = [...listed.keys()].filter((id) => !reached.has(id));
  const onlyReached = [...reached].filter((id) => !listed.has(id));
  if (onlyListed.length === 0 && onlyReached.length === 0) {
    return;
  }
  throw new Error(
    [
      "pnpm's bill of materials and pnpm-lock.yaml disagree on the production packages.",
      ...(onlyListed.length > 0
        ? [`Only the bill lists: ${onlyListed.sort().join(", ")}.`]
        : []),
      ...(onlyReached.length > 0
        ? [`Only the lockfile reaches: ${onlyReached.sort().join(", ")}.`]
        : []),
    ].join(" "),
  );
}

function referenceOf(references: ReferencesById, id: PackageId): string {
  const reference = references.get(id);
  if (reference === undefined) {
    throw new Error(`The bill of materials lists no component for ${id}.`);
  }
  return reference;
}

export function completeDependencyGraph(
  bill: BillOfMaterials,
  graph: LockfileGraph,
): BillOfMaterials {
  const references = referencesById(bill);
  assertSamePackages(references, packagesOf(graph));
  const referencesOf = (ids: readonly PackageId[]): string[] =>
    ids.map((id) => referenceOf(references, id));
  return {
    ...bill,
    dependencies: orderedDependencies([
      {
        ref: bill.metadata.component["bom-ref"],
        dependsOn: referencesOf(graph.roots),
      },
      ...[...references].map(([id, ref]) => ({
        ref,
        dependsOn: referencesOf(graph.edges.get(id) ?? []),
      })),
    ]),
  };
}
