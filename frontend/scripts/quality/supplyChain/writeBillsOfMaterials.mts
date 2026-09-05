import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { runCommand } from "../commandRunner.mts";
import {
  countComponents,
  normalizeBillOfMaterials,
  parseBillOfMaterials,
  type BillOfMaterials,
} from "./billsOfMaterials.mts";
import { completeDependencyGraph } from "./completeDependencyGraph.mts";
import { parseLockfileGraph } from "./lockfileDependencyGraph.mts";

export const billOfMaterialsDirectory = "docs/quality/sbom";

const cycloneDxSpecificationVersion = "1.6";

export interface DescribedBillOfMaterials {
  path: string;
  describes: string;
}

export interface WrittenBillOfMaterials extends DescribedBillOfMaterials {
  components: number;
}

interface BillOfMaterialsSpecification extends DescribedBillOfMaterials {
  generate: (repositoryRoot: string, generatedFile: string) => BillOfMaterials;
}

function readGeneratedBill(generatedFile: string): BillOfMaterials {
  return parseBillOfMaterials(readFileSync(generatedFile, "utf8"));
}

// pnpm sbom leaves about a third of the production dependency edges out of its
// graph, so the graph is rebuilt from the lockfile it was generated from.
function generateFrontendBill(
  repositoryRoot: string,
  generatedFile: string,
): BillOfMaterials {
  runCommand({
    command: "pnpm",
    args: [
      "sbom",
      "--sbom-format",
      "cyclonedx",
      "--sbom-spec-version",
      cycloneDxSpecificationVersion,
      "--prod",
      "--lockfile-only",
      "--filter",
      "frontend",
      "--out",
      generatedFile,
    ],
    cwd: repositoryRoot,
  });
  return completeDependencyGraph(
    readGeneratedBill(generatedFile),
    parseLockfileGraph(
      readFileSync(resolve(repositoryRoot, "pnpm-lock.yaml"), "utf8"),
      "frontend",
    ),
  );
}

function generateBackendBill(
  repositoryRoot: string,
  generatedFile: string,
): BillOfMaterials {
  runCommand({
    command: "dotnet",
    args: [
      "dotnet-CycloneDX",
      "backend/ValuesWorkshop.sln",
      "--output",
      dirname(generatedFile),
      "--filename",
      basename(generatedFile),
      "--output-format",
      "Json",
      "--spec-version",
      cycloneDxSpecificationVersion,
      "--no-serial-number",
      "--exclude-dev",
    ],
    cwd: repositoryRoot,
  });
  return readGeneratedBill(generatedFile);
}

const specifications: readonly BillOfMaterialsSpecification[] = [
  {
    path: `${billOfMaterialsDirectory}/frontend.cdx.json`,
    describes: "frontend runtime dependencies of the pnpm workspace",
    generate: generateFrontendBill,
  },
  {
    path: `${billOfMaterialsDirectory}/backend.cdx.json`,
    describes: "backend runtime packages of the .NET solution",
    generate: generateBackendBill,
  },
];

export const describedBillsOfMaterials: readonly DescribedBillOfMaterials[] =
  specifications.map(({ path, describes }) => ({ path, describes }));

export function writeBillsOfMaterials(
  repositoryRoot: string,
): WrittenBillOfMaterials[] {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "bills-of-materials-"));
  try {
    mkdirSync(resolve(repositoryRoot, billOfMaterialsDirectory), {
      recursive: true,
    });
    return specifications.map((specification) => {
      const generatedFile = join(
        temporaryDirectory,
        basename(specification.path),
      );
      const document = normalizeBillOfMaterials(
        specification.generate(repositoryRoot, generatedFile),
      );
      writeFileSync(resolve(repositoryRoot, specification.path), document);
      return {
        path: specification.path,
        describes: specification.describes,
        components: countComponents(document),
      };
    });
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("writeBillsOfMaterials.mts") ?? false;
}

if (isInvokedAsScript()) {
  for (const bill of writeBillsOfMaterials(resolve(process.cwd(), ".."))) {
    process.stdout.write(
      `Wrote ${bill.path} — ${bill.components} components, ${bill.describes}\n`,
    );
  }
}
