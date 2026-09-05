import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLockfileGraph } from "../quality/supplyChain/lockfileDependencyGraph.mts";

const lockfileExcerpt = readFileSync(
  join(__dirname, "fixtures/quality/lockfileExcerpt.yaml"),
  "utf8",
);

describe("parseLockfileGraph", () => {
  const graph = parseLockfileGraph(lockfileExcerpt, "frontend");

  it("roots the graph at the importer's production dependencies, peer suffixes stripped", () => {
    expect(graph.roots).toEqual([
      "next@16.2.11",
      "react@19.2.4",
      "react-dom@19.2.4",
      "rxjs@7.8.2",
    ]);
  });

  it("strips a nested peer suffix from every edge's source and target", () => {
    expect(graph.edges.get("next@16.2.11")).toEqual([
      "@swc/helpers@0.5.15",
      "react-dom@19.2.4",
      "react@19.2.4",
      "sharp@0.35.3",
      "styled-jsx@5.1.6",
    ]);
    expect(graph.edges.get("styled-jsx@5.1.6")).toEqual([
      "@babel/core@7.29.7",
      "client-only@0.0.1",
      "react@19.2.4",
    ]);
  });

  it("counts optional dependencies as edges, since their packages are components", () => {
    expect(graph.edges.get("sharp@0.35.3")).toEqual([
      "@img/sharp-linux-x64@0.35.3",
      "debug@4.4.3",
      "detect-libc@2.1.2",
    ]);
    expect(graph.edges.get("@img/sharp-linux-x64@0.35.3")).toEqual([
      "@img/sharp-libvips-linux-x64@1.3.2",
    ]);
  });

  it("unions the edges of the reachable snapshots that share one package", () => {
    expect(graph.edges.get("debug@4.4.3")).toEqual([
      "ms@2.1.3",
      "supports-color@10.2.2",
    ]);
  });

  it("leaves out what only development dependencies reach, other snapshots of a production package included", () => {
    expect(graph.edges.has("typescript@5.9.3")).toBe(false);
    expect(graph.edges.has("eslint@9.39.5")).toBe(false);
    expect(graph.edges.has("supports-color@9.4.0")).toBe(false);
    expect(graph.edges.has("@playwright/test@1.61.1")).toBe(false);
  });

  it("records every reachable package, a leaf as an empty edge list", () => {
    expect([...graph.edges.keys()].sort()).toEqual([
      "@babel/core@7.29.7",
      "@img/sharp-libvips-linux-x64@1.3.2",
      "@img/sharp-linux-x64@0.35.3",
      "@swc/helpers@0.5.15",
      "client-only@0.0.1",
      "debug@4.4.3",
      "detect-libc@2.1.2",
      "ms@2.1.3",
      "next@16.2.11",
      "react-dom@19.2.4",
      "react@19.2.4",
      "rxjs@7.8.2",
      "scheduler@0.27.0",
      "sharp@0.35.3",
      "styled-jsx@5.1.6",
      "supports-color@10.2.2",
      "tslib@2.8.1",
    ]);
    expect(graph.edges.get("tslib@2.8.1")).toEqual([]);
  });

  it("refuses an importer the lockfile does not know", () => {
    expect(() => parseLockfileGraph(lockfileExcerpt, "backend")).toThrow(
      'pnpm-lock.yaml has no importer "backend"',
    );
  });

  it("refuses a lockfile that references a snapshot it does not contain", () => {
    const withoutScheduler = lockfileExcerpt.replace(
      "  scheduler@0.27.0: {}\n",
      "",
    );
    expect(() => parseLockfileGraph(withoutScheduler, "frontend")).toThrow(
      'pnpm-lock.yaml has no snapshot "scheduler@0.27.0", which react-dom@19.2.4(react@19.2.4) depends on',
    );
  });

  it("refuses a document that is not a pnpm lockfile", () => {
    expect(() =>
      parseLockfileGraph("lockfileVersion: '9.0'\n", "frontend"),
    ).toThrow("is not a pnpm lockfile this reader understands");
  });
});

describe("parseLockfileGraph on the repository's lockfile", () => {
  it("roots the frontend graph at exactly the production dependencies of frontend/package.json", () => {
    const graph = parseLockfileGraph(
      readFileSync(join(__dirname, "../../../pnpm-lock.yaml"), "utf8"),
      "frontend",
    );
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };
    expect(
      graph.roots.map((root) => root.slice(0, root.lastIndexOf("@"))).sort(),
    ).toEqual(Object.keys(packageJson.dependencies).sort());
  });
});
