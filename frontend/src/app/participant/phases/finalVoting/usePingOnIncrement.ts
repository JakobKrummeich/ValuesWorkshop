"use client";

import { useState } from "react";

export function usePingOnIncrement(count: number): number {
  const [seenCount, setSeenCount] = useState(count);
  const [pingKey, setPingKey] = useState(0);

  if (count !== seenCount) {
    setSeenCount(count);
    if (count > seenCount) {
      setPingKey(pingKey + 1);
    }
  }

  return pingKey;
}
