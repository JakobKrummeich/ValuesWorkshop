"use client";

import type { ReactNode } from "react";
import { stubFacilitatorGateway } from "../../adapters/stubFacilitatorGateway";
import { FacilitatorDependencyProvider } from "./dependencies";

export default function FacilitatorLayout({ children }: { children: ReactNode }) {
  return (
    <FacilitatorDependencyProvider dependencies={{ gateway: stubFacilitatorGateway }}>
      {children}
    </FacilitatorDependencyProvider>
  );
}
