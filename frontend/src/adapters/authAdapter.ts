import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

const authority =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_OIDC_AUTHORITY ?? "http://localhost:9000")
    : "";

const clientId =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? "valuesworkshop")
    : "";

const redirectUri =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI ??
      `${window.location.origin}/auth/callback`)
    : "";

function createUserManager(): UserManager | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile offline_access",
    automaticSilentRenew: true,
    includeIdTokenInSilentRenew: false,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  });
}

let userManagerInstance: UserManager | null = null;

function getUserManager(): UserManager {
  if (typeof window === "undefined") {
    throw new Error("UserManager is only available in the browser");
  }
  if (!userManagerInstance) {
    userManagerInstance = createUserManager();
  }
  return userManagerInstance!;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const manager = getUserManager();
  const user = await manager.getUser();
  if (user && !user.expired) {
    return user;
  }
  return null;
}

export async function loginRedirect(returnUrl?: string): Promise<void> {
  const manager = getUserManager();
  await manager.signinRedirect({
    state: returnUrl ?? window.location.pathname,
  });
}

export async function handleCallback(): Promise<User> {
  const manager = getUserManager();
  return manager.signinRedirectCallback();
}

export async function getAccessToken(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.access_token ?? null;
}

export async function logout(): Promise<void> {
  const manager = getUserManager();
  await manager.signoutRedirect();
}

export function navigateReplace(url: string): void {
  window.location.replace(url);
}
