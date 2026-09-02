import { baseTokenValue } from "../../testing/designTokens";
import {
  motionBaseMilliseconds,
  motionRevealMilliseconds,
  motionSlowMilliseconds,
  motionStaggerMilliseconds,
} from "../motion";

describe("motion durations", () => {
  it.each([
    ["--base-motion-base", motionBaseMilliseconds],
    ["--base-motion-slow", motionSlowMilliseconds],
    ["--base-motion-reveal", motionRevealMilliseconds],
    ["--base-motion-stagger", motionStaggerMilliseconds],
  ])("mirror the %s token", (token, milliseconds) => {
    expect(baseTokenValue(token)).toBe(`${milliseconds}ms`);
  });
});
