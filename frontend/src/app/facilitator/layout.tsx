"use client";

import type { ReactNode } from "react";
import { stubFacilitatorGateway } from "../../adapters/stubFacilitatorGateway";
import { FacilitatorPortsProvider } from "./ports";

/** Composition root of the facilitator screen group: wires adapters into ports. */
export default function FacilitatorLayout({ children }: { children: ReactNode }) {
  return (
    <FacilitatorPortsProvider gateway={stubFacilitatorGateway}>
      {children}
    </FacilitatorPortsProvider>
  );
}
