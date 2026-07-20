import type { Clock } from "../ports/clock";

/** Adapter: Clock backed by the system time. */
export const systemClock: Clock = {
  now: () => new Date(),
};
