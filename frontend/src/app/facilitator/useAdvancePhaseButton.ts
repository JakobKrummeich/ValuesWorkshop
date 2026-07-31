"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Subscription } from "rxjs";
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
  const subscriptions = useRef(new Subscription());

  useEffect(() => {
    const pending = subscriptions.current;

    return () => {
      pending.unsubscribe();
    };
  }, []);

  const advancePhase = useCallback(() => {
    setAdvancing(true);
    subscriptions.current.add(
      lifecycle.advancePhase().subscribe({
        next(result) {
          setRejectionDetail(result.isAccepted ? null : result.detail);
        },
        error(error: Error) {
          setRejectionDetail(error.message);
        },
        complete() {
          setAdvancing(false);
        },
      }),
    );
  }, [lifecycle]);

  return { isAdvancing, rejectionDetail, advancePhase };
}
