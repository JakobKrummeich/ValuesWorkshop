import {
  collectTrackedPaths,
  type CollectionContext,
} from "./collectionContext.mts";
import {
  collectArchitecture,
  collectComplexity,
  collectDuplication,
  collectSecurity,
  collectSupplyChain,
  collectTests,
} from "./collectGateMetrics.mts";
import { readMutationRecord } from "./mutation/readMutationRecord.mts";
import {
  collectCommitStamp,
  collectContract,
  collectDesignSystem,
  collectEnforcedLimits,
  collectProcess,
  collectSize,
} from "./collectSourceMetrics.mts";
import type { CollectedMetrics } from "./qualityReport.mts";
import { parseJestReport, testsInFile } from "./testCounts.mts";

const frontendContractTest = "wireContract.test.ts";
const contrastTest = "tokensContrast.test.ts";

export function collectQualityMetrics(
  context: CollectionContext,
): CollectedMetrics {
  const commit = collectCommitStamp(context);
  const tracked = collectTrackedPaths(context);
  const size = collectSize(context, tracked);
  const tests = collectTests(context);
  const jestTests = parseJestReport(tests.jestReportJson);
  return {
    commit,
    enforcedLimits: collectEnforcedLimits(context),
    size,
    tests: tests.group,
    complexity: collectComplexity(context, size),
    duplication: collectDuplication(context),
    architecture: collectArchitecture(context),
    designSystem: collectDesignSystem(
      context,
      tracked,
      testsInFile(jestTests, contrastTest),
    ),
    contract: collectContract(
      context,
      tracked,
      testsInFile(jestTests, frontendContractTest),
    ),
    security: collectSecurity(context),
    supplyChain: collectSupplyChain(context),
    mutation: readMutationRecord(context.repositoryRoot),
    process: collectProcess(context, commit),
  };
}
