"use client";

import type { ReactNode } from "react";
import { createPresenterSession } from "../../adapters/workshopSessions";
import { MissingSession } from "../MissingSession";
import { useWorkshopSession } from "../useWorkshopSession";
import { PresenterDependencyProvider } from "./dependencies";
import "./tokens.presenter.css";

export default function PresenterLayout({ children }: { children: ReactNode }) {
  const { session, isSessionIdentityMissing } = useWorkshopSession(
    createPresenterSession,
  );

  if (isSessionIdentityMissing) {
    return <MissingSession />;
  }

  if (session === null) {
    return null;
  }

  return (
    <PresenterDependencyProvider
      dependencies={{ sessionState: session.sessionState }}
    >
      <div className="screenPresenter">{children}</div>
    </PresenterDependencyProvider>
  );
}
