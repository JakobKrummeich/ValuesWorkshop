"use client";

import type { ReactNode } from "react";
import { stubPresenterGateway } from "../../adapters/stubPresenterGateway";
import { PresenterPortsProvider } from "./ports";

/** Composition root of the presenter screen group: wires adapters into ports. */
export default function PresenterLayout({ children }: { children: ReactNode }) {
  return (
    <PresenterPortsProvider gateway={stubPresenterGateway}>
      {children}
    </PresenterPortsProvider>
  );
}
