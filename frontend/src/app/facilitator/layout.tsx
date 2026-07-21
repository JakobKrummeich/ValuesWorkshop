"use client";

import type { ReactNode } from "react";
import { stubFacilitatorGateway } from "../../adapters/stubFacilitatorGateway";
import { FacilitatorDependencyProvider } from "./dependencies";
import "./tokens.facilitator.css";

export default function FacilitatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FacilitatorDependencyProvider
      dependencies={{ gateway: stubFacilitatorGateway }}
    >
      <div className="screenFacilitator">{children}</div>
    </FacilitatorDependencyProvider>
  );
}
