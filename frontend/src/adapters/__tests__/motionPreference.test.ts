import { motionIsAllowed } from "../motionPreference";

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches, media: query }),
  });
}

describe("motion preference", () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it("allows motion when the reader has not asked for less of it", () => {
    stubMatchMedia(false);

    expect(motionIsAllowed()).toBe(true);
  });

  it("forbids motion when the reader prefers reduced motion", () => {
    stubMatchMedia(true);

    expect(motionIsAllowed()).toBe(false);
  });

  it("forbids motion where the preference cannot be read", () => {
    expect(motionIsAllowed()).toBe(false);
  });
});
