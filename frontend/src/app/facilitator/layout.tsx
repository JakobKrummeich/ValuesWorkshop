"use client";

import type { ReactNode } from "react";
import { stubFacilitatorGateway } from "../../adapters/stubFacilitatorGateway";
import { FacilitatorPortsProvider } from "./ports";

export default function FacilitatorLayout({ children }: { children: ReactNode }) {
  return (
    <FacilitatorPortsProvider gateway={stubFacilitatorGateway}>
      {children}
    </FacilitatorPortsProvider>
  );
}
