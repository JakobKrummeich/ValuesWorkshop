import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseBillOfMaterials,
  type BillOfMaterials,
} from "../quality/supplyChain/billsOfMaterials.mts";
import { completeDependencyGraph } from "../quality/supplyChain/completeDependencyGraph.mts";
import { parseLockfileGraph } from "../quality/supplyChain/lockfileDependencyGraph.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

const bill = parseBillOfMaterials(fixture("pnpmSbomExcerpt.json"));
const graph = parseLockfileGraph(fixture("lockfileExcerpt.yaml"), "frontend");

const dependsOnOf = (completed: BillOfMaterials, ref: string) =>
  completed.dependencies?.find((dependency) => dependency.ref === ref)
    ?.dependsOn;

describe("completeDependencyGraph", () => {
  const completed = completeDependencyGraph(bill, graph);

  it("adds the edges pnpm left out, as the very references pnpm gave the components", () => {
    expect(dependsOnOf(completed, "pkg:npm/next@16.2.11")).toEqual([
      "pkg:npm/%40swc/helpers@0.5.15",
      "pkg:npm/react-dom@19.2.4",
      "pkg:npm/react@19.2.4",
      "pkg:npm/sharp@0.35.3",
      "pkg:npm/styled-jsx@5.1.6",
    ]);
    expect(dependsOnOf(completed, "pkg:npm/react-dom@19.2.4")).toEqual([
      "pkg:npm/react@19.2.4",
      "pkg:npm/scheduler@0.27.0",
    ]);
    expect(dependsOnOf(completed, "pkg:npm/rxjs@7.8.2")).toEqual([
      "pkg:npm/tslib@2.8.1",
    ]);
    expect(dependsOnOf(completed, "pkg:npm/styled-jsx@5.1.6")).toEqual([
      "pkg:npm/%40babel/core@7.29.7",
      "pkg:npm/client-only@0.0.1",
      "pkg:npm/react@19.2.4",
    ]);
    expect(dependsOnOf(completed, "pkg:npm/debug@4.4.3")).toEqual([
      "pkg:npm/ms@2.1.3",
      "pkg:npm/supports-color@10.2.2",
    ]);
  });

  it("makes the root component depend on the importer's production dependencies", () => {
    expect(dependsOnOf(completed, "pkg:npm/frontend@0.1.0")).toEqual([
      "pkg:npm/next@16.2.11",
      "pkg:npm/react-dom@19.2.4",
      "pkg:npm/react@19.2.4",
      "pkg:npm/rxjs@7.8.2",
    ]);
  });

  it("lists one entry per component plus the root, in reference order", () => {
    expect(completed.dependencies?.map((dependency) => dependency.ref)).toEqual(
      [
        "pkg:npm/%40babel/core@7.29.7",
        "pkg:npm/%40img/sharp-libvips-linux-x64@1.3.2",
        "pkg:npm/%40img/sharp-linux-x64@0.35.3",
        "pkg:npm/%40swc/helpers@0.5.15",
        "pkg:npm/client-only@0.0.1",
        "pkg:npm/debug@4.4.3",
        "pkg:npm/detect-libc@2.1.2",
        "pkg:npm/frontend@0.1.0",
        "pkg:npm/ms@2.1.3",
        "pkg:npm/next@16.2.11",
        "pkg:npm/react-dom@19.2.4",
        "pkg:npm/react@19.2.4",
        "pkg:npm/rxjs@7.8.2",
        "pkg:npm/scheduler@0.27.0",
        "pkg:npm/sharp@0.35.3",
        "pkg:npm/styled-jsx@5.1.6",
        "pkg:npm/supports-color@10.2.2",
        "pkg:npm/tslib@2.8.1",
      ],
    );
    expect(dependsOnOf(completed, "pkg:npm/tslib@2.8.1")).toEqual([]);
  });

  it("changes nothing but the dependency graph", () => {
    expect({ ...completed, dependencies: undefined }).toEqual({
      ...bill,
      dependencies: undefined,
    });
  });

  it("refuses a bill listing a package the lockfile never reaches", () => {
    const withTypesNode: BillOfMaterials = {
      ...bill,
      components: [
        ...bill.components,
        {
          name: "node",
          group: "@types",
          version: "20.19.43",
          "bom-ref": "pkg:npm/%40types/node@20.19.43",
        },
      ],
    };
    expect(() => completeDependencyGraph(withTypesNode, graph)).toThrow(
      "pnpm's bill of materials and pnpm-lock.yaml disagree on the production packages. Only the bill lists: @types/node@20.19.43.",
    );
  });

  it("refuses a bill missing a package the lockfile reaches", () => {
    const withoutTslibAndMs: BillOfMaterials = {
      ...bill,
      components: bill.components.filter(
        (component) => !["tslib", "ms"].includes(component.name),
      ),
    };
    expect(() => completeDependencyGraph(withoutTslibAndMs, graph)).toThrow(
      "pnpm's bill of materials and pnpm-lock.yaml disagree on the production packages. Only the lockfile reaches: ms@2.1.3, tslib@2.8.1.",
    );
  });

  it("names the packages of both sides when both disagree", () => {
    const disagreeing: BillOfMaterials = {
      ...bill,
      components: [
        ...bill.components.filter((component) => component.name !== "tslib"),
        { name: "tslib", version: "2.8.0", "bom-ref": "pkg:npm/tslib@2.8.0" },
      ],
    };
    expect(() => completeDependencyGraph(disagreeing, graph)).toThrow(
      "Only the bill lists: tslib@2.8.0. Only the lockfile reaches: tslib@2.8.1.",
    );
  });

  it("refuses a component whose reference is not an npm package URL", () => {
    const withNugetReference: BillOfMaterials = {
      ...bill,
      components: [
        ...bill.components,
        { name: "Zod", version: "1.0.0", "bom-ref": "pkg:nuget/Zod@1.0.0" },
      ],
    };
    expect(() => completeDependencyGraph(withNugetReference, graph)).toThrow(
      'The component reference "pkg:nuget/Zod@1.0.0" is not an npm package URL.',
    );
  });
});
