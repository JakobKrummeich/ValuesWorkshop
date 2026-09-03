"use client";

import type { ReactNode } from "react";
import { MessageKey } from "../domain/i18n/messages";
import { EntryNotice } from "./EntryNotice";
import { useTranslation } from "./i18n/useTranslation";
import { useAuthGuard, AuthGuardState } from "./useAuthGuard";

type PendingAuthState = Exclude<AuthGuardState, AuthGuardState.Authenticated>;

const noticeByState: Readonly<Record<PendingAuthState, MessageKey>> = {
  [AuthGuardState.Checking]: MessageKey.AuthChecking,
  [AuthGuardState.Redirecting]: MessageKey.AuthRedirecting,
  [AuthGuardState.Error]: MessageKey.AuthProviderUnavailable,
};

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state } = useAuthGuard();
  const { translate } = useTranslation();

  if (state === AuthGuardState.Authenticated) {
    return <>{children}</>;
  }

  return <EntryNotice body={translate(noticeByState[state])} />;
}
