"use client";

import type { ReactNode } from "react";
import { stubPresenterGateway } from "../../adapters/stubPresenterGateway";
import { PresenterDependencyProvider } from "./dependencies";

export default function PresenterLayout({ children }: { children: ReactNode }) {
  return (
    <PresenterDependencyProvider dependencies={{ gateway: stubPresenterGateway }}>
      {children}
    </PresenterDependencyProvider>
  );
}
