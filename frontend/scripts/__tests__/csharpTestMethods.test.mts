import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTestMethodNames } from "../quality/csharpTestMethods.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseTestMethodNames", () => {
  it("names every rule the backend architecture test asserts", () => {
    expect(parseTestMethodNames(fixture("hostArchitectureTests.txt"))).toEqual([
      "Host_is_the_executable_composition_root",
      "Only_the_CpSat_adapter_references_OrTools",
    ]);
  });

  it("leaves the private helpers of the test class out", () => {
    const names = parseTestMethodNames(fixture("hostArchitectureTests.txt"));
    expect(names).not.toContain("BackendSourceFiles");
    expect(names).not.toContain("BackendSourceRoot");
  });

  it("reads the rules asserted through ArchUnitNET", () => {
    expect(
      parseTestMethodNames(fixture("domainArchitectureTests.txt")),
    ).toEqual([
      "Domain_depends_on_no_other_ValuesWorkshop_layer",
      "Application_depends_only_on_Domain",
      "Adapters_Persistence_depends_only_on_Application_and_Domain",
      "Adapters_Web_depends_only_on_Application_and_Domain",
      "No_class_has_more_than_12_public_methods",
    ]);
  });

  it("counts a theory over the wire fixtures as one contract test", () => {
    expect(parseTestMethodNames(fixture("wireStateContractTests.txt"))).toEqual(
      [
        "The_checked_in_state_corpus_matches_the_mappers",
        "The_state_corpus_holds_nothing_but_the_fixtures",
      ],
    );
  });
});
