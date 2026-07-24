import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { defer, filter, ignoreElements } from "rxjs";
import type { Completable, Maybe, Single } from "../shared/reactiveTypes";

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

export function getAuthenticatedUser(): Maybe<User> {
  return defer(async () => {
    const manager = getUserManager();
    const user = await manager.getUser();
    if (user && !user.expired) {
      return user;
    }
    return null;
  }).pipe(filter((user): user is User => user !== null));
}

export function loginRedirect(returnUrl?: string): Completable {
  return defer(async () => {
    const manager = getUserManager();
    await manager.signinRedirect({
      state: returnUrl ?? window.location.pathname,
    });
  }).pipe(ignoreElements());
}

export function handleCallback(): Single<User> {
  return defer(() => {
    const manager = getUserManager();
    return manager.signinRedirectCallback();
  });
}

export function getAccessToken(): Maybe<string> {
  return defer(async () => {
    const manager = getUserManager();
    const user = await manager.getUser();
    if (user && !user.expired) {
      return user.access_token;
    }
    return null;
  }).pipe(filter((token): token is string => token !== null));
}

export function logout(): Completable {
  return defer(() => {
    const manager = getUserManager();
    return manager.signoutRedirect();
  }).pipe(ignoreElements());
}

export function navigateReplace(url: string): void {
  window.location.replace(url);
}
