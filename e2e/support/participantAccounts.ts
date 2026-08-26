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

const accountNameByDisplayName = new Map<string, string>();
for (const account of participantAccounts) {
  if (accountNameByDisplayName.has(account.displayName)) {
    throw new Error(
      `Two test accounts share the display name "${account.displayName}"`,
    );
  }
  accountNameByDisplayName.set(account.displayName, account.accountName);
}

export function accountNameOf(displayName: string): string {
  const accountName = accountNameByDisplayName.get(displayName);

  if (accountName === undefined) {
    throw new Error(`No test account has the display name "${displayName}"`);
  }

  return accountName;
}
