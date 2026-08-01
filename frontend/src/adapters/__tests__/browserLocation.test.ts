import { currentReturnUrl, currentSessionIdentity } from "../browserLocation";

describe("session identity in the link", () => {
  it("reads the sessionIdentity query parameter", () => {
    window.history.replaceState({}, "", "/participant?sessionIdentity=abc-123");

    expect(currentSessionIdentity()).toBe("abc-123");
  });

  it("returns nothing when the link carries no session", () => {
    window.history.replaceState({}, "", "/participant");

    expect(currentSessionIdentity()).toBeNull();
  });
});

describe("return url after login", () => {
  it("keeps path and query so the session survives the login redirect", () => {
    window.history.replaceState({}, "", "/facilitator?sessionIdentity=abc-123");

    expect(currentReturnUrl()).toBe("/facilitator?sessionIdentity=abc-123");
  });
});
