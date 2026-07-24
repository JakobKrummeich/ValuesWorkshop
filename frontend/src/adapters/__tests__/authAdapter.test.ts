import { firstValueFrom } from "rxjs";

const mockGetUser = jest.fn();
const mockSigninRedirect = jest.fn();
const mockSigninRedirectCallback = jest.fn();
const mockSignoutRedirect = jest.fn();

jest.mock("oidc-client-ts", () => ({
  UserManager: jest.fn().mockImplementation(() => ({
    getUser: mockGetUser,
    signinRedirect: mockSigninRedirect,
    signinRedirectCallback: mockSigninRedirectCallback,
    signoutRedirect: mockSignoutRedirect,
  })),
  WebStorageStateStore: jest.fn(),
}));

import {
  getAuthenticatedUser$,
  loginRedirect$,
  handleCallback$,
  getAccessToken$,
} from "../authAdapter";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authAdapter", () => {
  describe("getAuthenticatedUser$", () => {
    it("emits user when authenticated and not expired", async () => {
      const mockUser = { access_token: "token", expired: false };
      mockGetUser.mockResolvedValue(mockUser);

      const user = await firstValueFrom(getAuthenticatedUser$());

      expect(user).toBe(mockUser);
    });

    it("emits null when user is expired", async () => {
      mockGetUser.mockResolvedValue({ access_token: "token", expired: true });

      const user = await firstValueFrom(getAuthenticatedUser$());

      expect(user).toBeNull();
    });

    it("emits null when no user exists", async () => {
      mockGetUser.mockResolvedValue(null);

      const user = await firstValueFrom(getAuthenticatedUser$());

      expect(user).toBeNull();
    });
  });

  describe("loginRedirect$", () => {
    it("calls signinRedirect with return URL as state", async () => {
      mockSigninRedirect.mockResolvedValue(undefined);

      await firstValueFrom(loginRedirect$("/facilitator"));

      expect(mockSigninRedirect).toHaveBeenCalledWith({
        state: "/facilitator",
      });
    });

    it("uses current pathname when no return URL provided", async () => {
      mockSigninRedirect.mockResolvedValue(undefined);

      await firstValueFrom(loginRedirect$());

      expect(mockSigninRedirect).toHaveBeenCalledWith({
        state: window.location.pathname,
      });
    });
  });

  describe("handleCallback$", () => {
    it("delegates to signinRedirectCallback", async () => {
      const mockUser = { access_token: "token" };
      mockSigninRedirectCallback.mockResolvedValue(mockUser);

      const user = await firstValueFrom(handleCallback$());

      expect(user).toBe(mockUser);
      expect(mockSigninRedirectCallback).toHaveBeenCalled();
    });
  });

  describe("getAccessToken$", () => {
    it("emits access token when user is authenticated", async () => {
      mockGetUser.mockResolvedValue({
        access_token: "my-token",
        expired: false,
      });

      const token = await firstValueFrom(getAccessToken$());

      expect(token).toBe("my-token");
    });

    it("emits null when no user", async () => {
      mockGetUser.mockResolvedValue(null);

      const token = await firstValueFrom(getAccessToken$());

      expect(token).toBeNull();
    });
  });
});
