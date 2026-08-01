"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { useFacilitatorDependencies } from "./dependencies";

export interface AdvancePhaseButtonResult {
  isAdvancing: boolean;
  rejectionDetail: string | null;
  advancePhase: () => void;
}

export function useAdvancePhaseButton(): AdvancePhaseButtonResult {
  const { lifecycle } = useFacilitatorDependencies();
  const [isAdvancing, setAdvancing] = useState(false);
  const [rejectionDetail, setRejectionDetail] = useState<string | null>(null);
  const inFlightIntent = useRef<Subscription | null>(null);

  useEffect(
    () => () => {
      inFlightIntent.current?.unsubscribe();
    },
    [],
  );

  const advancePhase = useCallback(() => {
    setAdvancing(true);
    inFlightIntent.current?.unsubscribe();
    inFlightIntent.current = lifecycle.advancePhase().subscribe({
      next(result) {
        setRejectionDetail(result.isAccepted ? null : result.detail);
      },
      error(error: Error) {
        setRejectionDetail(error.message);
        setAdvancing(false);
      },
      complete() {
        setAdvancing(false);
      },
    });
  }, [lifecycle]);

  return { isAdvancing, rejectionDetail, advancePhase };
}
