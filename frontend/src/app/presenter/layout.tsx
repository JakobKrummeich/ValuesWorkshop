"use client";

import type { ReactNode } from "react";
import { createPresenterSession } from "../../adapters/workshopSessions";
import { SessionBoundary } from "../SessionBoundary";
import { PresenterDependencyProvider } from "./dependencies";
import "./tokens.presenter.css";

export default function PresenterLayout({ children }: { children: ReactNode }) {
  return (
    <SessionBoundary createSession={createPresenterSession}>
      {(session) => (
        <PresenterDependencyProvider
          dependencies={{ sessionStatePort: session.sessionStatePort }}
        >
          <div className="screenPresenter">{children}</div>
        </PresenterDependencyProvider>
      )}
    </SessionBoundary>
  );
}
