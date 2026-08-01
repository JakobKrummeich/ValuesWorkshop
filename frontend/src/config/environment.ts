function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`The environment variable ${name} is not configured`);
  }

  return value;
}

export function hubBaseUrl(): string {
  return required(
    "NEXT_PUBLIC_HUB_BASE_URL",
    process.env.NEXT_PUBLIC_HUB_BASE_URL,
  );
}

export function oidcAuthority(): string {
  return required(
    "NEXT_PUBLIC_OIDC_AUTHORITY",
    process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
  );
}

export function oidcClientId(): string {
  return required(
    "NEXT_PUBLIC_OIDC_CLIENT_ID",
    process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
  );
}

export function oidcRedirectUri(): string {
  return required(
    "NEXT_PUBLIC_OIDC_REDIRECT_URI",
    process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI,
  );
}
