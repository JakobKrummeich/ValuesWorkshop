import { z } from "zod";

const componentSchema = z.looseObject({
  name: z.string(),
  "bom-ref": z.string(),
});

const dependencySchema = z.looseObject({
  ref: z.string(),
  dependsOn: z.array(z.string()).optional(),
});

const billOfMaterialsSchema = z.looseObject({
  bomFormat: z.literal("CycloneDX"),
  specVersion: z.string(),
  metadata: z.looseObject({
    timestamp: z.string().optional(),
    component: z.looseObject({ "bom-ref": z.string() }),
  }),
  components: z.array(componentSchema),
  dependencies: z.array(dependencySchema).optional(),
});

export type BillOfMaterials = z.infer<typeof billOfMaterialsSchema>;

type Component = z.infer<typeof componentSchema>;
type Dependency = z.infer<typeof dependencySchema>;

export function parseBillOfMaterials(documentJson: string): BillOfMaterials {
  const parsed = billOfMaterialsSchema.safeParse(JSON.parse(documentJson));
  if (!parsed.success) {
    throw new Error(
      `The generator did not produce a CycloneDX bill of materials: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

function componentOrder(left: Component, right: Component): number {
  return left["bom-ref"].localeCompare(right["bom-ref"]);
}

export function orderedDependencies(
  dependencies: readonly Dependency[],
): Dependency[] {
  return [...dependencies]
    .map((dependency) =>
      dependency.dependsOn
        ? { ...dependency, dependsOn: [...dependency.dependsOn].sort() }
        : dependency,
    )
    .sort((left, right) => left.ref.localeCompare(right.ref));
}

function omitting(
  value: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );
}

export function normalizeBillOfMaterials(document: BillOfMaterials): string {
  return `${JSON.stringify(
    {
      ...omitting(document, ["serialNumber", "annotations"]),
      metadata: omitting(document.metadata, ["timestamp"]),
      components: [...document.components].sort(componentOrder),
      ...(document.dependencies
        ? { dependencies: orderedDependencies(document.dependencies) }
        : {}),
    },
    null,
    2,
  )}\n`;
}

export function countComponents(documentJson: string): number {
  return parseBillOfMaterials(documentJson).components.length;
}
