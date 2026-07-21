"use client";

import type { ReactNode } from "react";
import { stubPresenterGateway } from "../../adapters/stubPresenterGateway";
import { PresenterDependencyProvider } from "./dependencies";
import "./tokens.presenter.css";

export default function PresenterLayout({ children }: { children: ReactNode }) {
  return (
    <PresenterDependencyProvider
      dependencies={{ gateway: stubPresenterGateway }}
    >
      <div className="screenPresenter">{children}</div>
    </PresenterDependencyProvider>
  );
}
