import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type OidcAccountsFile = {
  facilitatorName: string;
  participantNames: string[];
};

export type ParticipantAccount = {
  accountName: string;
  displayName: string;
};

const accountsFile = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../devtools/oidc/accounts.json"),
    "utf8",
  ),
) as OidcAccountsFile;

export const participantAccounts: readonly ParticipantAccount[] =
  accountsFile.participantNames.map((displayName, index) => ({
    accountName: `participant${index + 1}`,
    displayName,
  }));

export function accountNameOf(displayName: string): string {
  const account = participantAccounts.find(
    (candidate) => candidate.displayName === displayName,
  );

  if (account === undefined) {
    throw new Error(`No test account has the display name "${displayName}"`);
  }

  return account.accountName;
}
