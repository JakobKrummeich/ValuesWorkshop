import { currentSessionIdentity } from "../browserLocation";

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
