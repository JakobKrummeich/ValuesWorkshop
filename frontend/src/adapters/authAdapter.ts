import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { defer, type Observable } from "rxjs";

let userManagerInstance: UserManager | null = null;

function getUserManager(): UserManager {
  if (typeof window === "undefined") {
    throw new Error("UserManager is only available in the browser");
  }
  if (!userManagerInstance) {
    userManagerInstance = new UserManager({
      authority:
        process.env.NEXT_PUBLIC_OIDC_AUTHORITY ?? "http://localhost:9000",
      client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? "valuesworkshop",
      redirect_uri:
        process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI ??
        `${window.location.origin}/auth/callback`,
      response_type: "code",
      scope: "openid profile offline_access",
      automaticSilentRenew: true,
      includeIdTokenInSilentRenew: false,
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });
  }
  return userManagerInstance;
}

export function getAuthenticatedUser$(): Observable<User | null> {
  return defer(async () => {
    const manager = getUserManager();
    const user = await manager.getUser();
    if (user && !user.expired) {
      return user;
    }
    return null;
  });
}

export function loginRedirect$(returnUrl?: string): Observable<void> {
  return defer(async () => {
    const manager = getUserManager();
    await manager.signinRedirect({
      state: returnUrl ?? window.location.pathname,
    });
  });
}

export function handleCallback$(): Observable<User> {
  return defer(() => {
    const manager = getUserManager();
    return manager.signinRedirectCallback();
  });
}

export function getAccessToken$(): Observable<string | null> {
  return defer(async () => {
    const manager = getUserManager();
    const user = await manager.getUser();
    if (user && !user.expired) {
      return user.access_token;
    }
    return null;
  });
}

export function logout$(): Observable<void> {
  return defer(() => {
    const manager = getUserManager();
    return manager.signoutRedirect();
  });
}

export function navigateReplace(url: string): void {
  window.location.replace(url);
}
