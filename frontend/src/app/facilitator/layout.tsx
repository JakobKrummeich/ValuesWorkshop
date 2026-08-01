"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "../AuthGuard";
import { FacilitatorSessionBoundary } from "./FacilitatorSessionBoundary";
import "./tokens.facilitator.css";

export default function FacilitatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <FacilitatorSessionBoundary>{children}</FacilitatorSessionBoundary>
    </AuthGuard>
  );
}
