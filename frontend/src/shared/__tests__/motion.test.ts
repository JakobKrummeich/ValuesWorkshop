import { baseTokenValue } from "../../testing/designTokens";
import {
  motionRevealMilliseconds,
  motionSlowMilliseconds,
  motionStaggerMilliseconds,
} from "../motion";

describe("motion durations", () => {
  it.each([
    ["--base-motion-slow", motionSlowMilliseconds],
    ["--base-motion-reveal", motionRevealMilliseconds],
    ["--base-motion-stagger", motionStaggerMilliseconds],
  ])("mirror the %s token", (token, milliseconds) => {
    expect(baseTokenValue(token)).toBe(`${milliseconds}ms`);
  });
});
