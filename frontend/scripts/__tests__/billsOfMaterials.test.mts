import {
  countComponents,
  normalizeBillOfMaterials,
  parseBillOfMaterials,
} from "../quality/supplyChain/billsOfMaterials.mts";

const generated = {
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  serialNumber: "urn:uuid:b084553c-04db-4251-b8d9-17ae296f2579",
  version: 1,
  metadata: {
    timestamp: "2026-09-04T18:25:12Z",
    tools: { components: [{ name: "cdxgen", version: "12.8.4" }] },
    component: { name: "frontend", "bom-ref": "pkg:npm/frontend@0.1.0" },
  },
  components: [
    { name: "react", version: "19.2.4", "bom-ref": "pkg:npm/react@19.2.4" },
    { name: "next", version: "16.2.11", "bom-ref": "pkg:npm/next@16.2.11" },
  ],
  dependencies: [
    {
      ref: "pkg:npm/react@19.2.4",
      dependsOn: ["pkg:npm/scheduler@0.2.0", "pkg:npm/loose-envify@1.4.0"],
    },
    { ref: "pkg:npm/next@16.2.11", dependsOn: [] },
  ],
  annotations: [{ text: "This document was created on Friday, September 4." }],
};

describe("parseBillOfMaterials", () => {
  it("refuses a document that is not a CycloneDX bill of materials", () => {
    expect(() => parseBillOfMaterials('{"components":[]}')).toThrow(
      "did not produce a CycloneDX bill of materials",
    );
  });

  it("refuses a component without the reference the dependency graph needs", () => {
    expect(() =>
      parseBillOfMaterials(
        JSON.stringify({
          ...generated,
          components: [{ name: "react", version: "19.2.4" }],
        }),
      ),
    ).toThrow("components.0.bom-ref");
  });
});

describe("normalizeBillOfMaterials", () => {
  const normalized = normalizeBillOfMaterials(
    parseBillOfMaterials(JSON.stringify(generated)),
  );

  it("drops the values that change with every run", () => {
    expect(normalized).not.toContain("serialNumber");
    expect(normalized).not.toContain("timestamp");
    expect(normalized).not.toContain("annotations");
  });

  it("keeps everything the document says about its components", () => {
    expect(JSON.parse(normalized)).toMatchObject({
      bomFormat: "CycloneDX",
      specVersion: "1.6",
      version: 1,
      metadata: {
        tools: generated.metadata.tools,
        component: generated.metadata.component,
      },
    });
  });

  it("orders components and dependencies so the file does not depend on the run", () => {
    expect(JSON.parse(normalized)).toMatchObject({
      components: [generated.components[1], generated.components[0]],
      dependencies: [
        { ref: "pkg:npm/next@16.2.11", dependsOn: [] },
        {
          ref: "pkg:npm/react@19.2.4",
          dependsOn: ["pkg:npm/loose-envify@1.4.0", "pkg:npm/scheduler@0.2.0"],
        },
      ],
    });
  });

  it("normalizes a document it already normalized to the same text", () => {
    expect(normalizeBillOfMaterials(parseBillOfMaterials(normalized))).toEqual(
      normalized,
    );
  });

  it("ends in a single newline", () => {
    expect(normalized.endsWith("}\n")).toBe(true);
  });
});

describe("countComponents", () => {
  it("counts the components the document lists", () => {
    expect(countComponents(JSON.stringify(generated))).toBe(2);
  });
});
