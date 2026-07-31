import { reconnectDelayMilliseconds } from "../reconnectBackoff";

describe("reconnect backoff", () => {
  it("grows exponentially and never exceeds the cap", () => {
    const delays = [0, 1, 2, 3, 10].map((previousRetryCount) =>
      reconnectDelayMilliseconds(previousRetryCount, () => 1),
    );

    expect(delays).toEqual([1000, 2000, 4000, 8000, 30000]);
  });

  it("jitters each delay down to at most half of the exponential value", () => {
    expect(reconnectDelayMilliseconds(2, () => 0)).toBe(2000);
  });

  it("retries forever so a restarted backend is always awaited", () => {
    expect(reconnectDelayMilliseconds(500)).toBeGreaterThan(0);
  });
});
