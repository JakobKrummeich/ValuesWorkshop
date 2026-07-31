const SESSION_IDENTITY_PARAMETER = "sessionIdentity";

export function currentSessionIdentity(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(
    SESSION_IDENTITY_PARAMETER,
  );
}
