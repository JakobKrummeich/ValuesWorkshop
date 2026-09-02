const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function motionIsAllowed(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
