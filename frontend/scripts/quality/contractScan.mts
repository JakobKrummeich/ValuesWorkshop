export interface ContractFixtureGroup {
  role: string;
  fixtures: number;
}

export interface ContractMetrics {
  fixtures: number;
  fixtureGroups: ContractFixtureGroup[];
  frontendAssertions: number;
  backendTestMethods: number;
}

const contractStateDirectory = "contract/state/";

export function countContractFixtures(
  trackedPaths: readonly string[],
): ContractFixtureGroup[] {
  const byRole = new Map<string, number>();
  for (const path of trackedPaths) {
    if (!path.startsWith(contractStateDirectory) || !path.endsWith(".json")) {
      continue;
    }
    const role = path.slice(contractStateDirectory.length).split("/")[0];
    byRole.set(role, (byRole.get(role) ?? 0) + 1);
  }
  return [...byRole.entries()]
    .map(([role, fixtures]) => ({ role, fixtures }))
    .sort((left, right) => left.role.localeCompare(right.role));
}

export function summarizeContract(
  trackedPaths: readonly string[],
  frontendAssertions: number,
  backendTestMethods: number,
): ContractMetrics {
  const fixtureGroups = countContractFixtures(trackedPaths);
  if (fixtureGroups.length === 0) {
    throw new Error(
      `No wire contract fixture was found under ${contractStateDirectory}.`,
    );
  }
  return {
    fixtures: fixtureGroups.reduce((sum, group) => sum + group.fixtures, 0),
    fixtureGroups,
    frontendAssertions,
    backendTestMethods,
  };
}
