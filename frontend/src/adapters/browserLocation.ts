const SESSION_IDENTITY_PARAMETER = "sessionIdentity";

export function currentReturnUrl(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function currentSessionIdentity(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(
    SESSION_IDENTITY_PARAMETER,
  );
}

export function sessionUrl(path: string, sessionIdentity: string): string {
  return `${path}?${SESSION_IDENTITY_PARAMETER}=${encodeURIComponent(sessionIdentity)}`;
}

export function navigateTo(url: string): void {
  window.location.assign(url);
}

export function navigateReplace(url: string): void {
  window.location.replace(url);
}
