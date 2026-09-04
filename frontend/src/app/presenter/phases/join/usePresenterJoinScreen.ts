"use client";

import { useEffect, useState } from "react";
import { participantJoinUrl } from "../../../../adapters/browserLocation";
import type { PresenterJoinState } from "../../../../domain/workshopState";

export const visibleNameLimit = 24;
export const newestGlowMilliseconds = 1500;

export interface RosterName {
  name: string;
  isNewest: boolean;
}

export interface PresenterJoinScreenModel {
  joinUrl: string | null;
  pingKey: number;
  visibleNames: RosterName[];
  hiddenCount: number;
}

export function usePresenterJoinScreen(
  state: PresenterJoinState,
): PresenterJoinScreenModel {
  const names = state.participantDisplayNames;
  const [seenCount, setSeenCount] = useState(names.length);
  const [newestFromIndex, setNewestFromIndex] = useState(names.length);
  const [pingKey, setPingKey] = useState(0);

  if (names.length !== seenCount) {
    setSeenCount(names.length);
    if (names.length > seenCount) {
      setNewestFromIndex(seenCount);
      setPingKey(pingKey + 1);
    }
  }

  const hasNewest = newestFromIndex < names.length;
  useEffect(() => {
    if (!hasNewest) {
      return undefined;
    }
    const glowTimer = setTimeout(
      () => setNewestFromIndex(names.length),
      newestGlowMilliseconds,
    );
    return () => clearTimeout(glowTimer);
  }, [hasNewest, names.length]);

  return {
    joinUrl: participantJoinUrl(),
    pingKey,
    visibleNames: names
      .slice(0, visibleNameLimit)
      .map((name, index) => ({ name, isNewest: index >= newestFromIndex })),
    hiddenCount: Math.max(0, names.length - visibleNameLimit),
  };
}
