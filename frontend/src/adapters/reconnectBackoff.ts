const INITIAL_RETRY_DELAY_MILLISECONDS = 1000;
const MAXIMUM_RETRY_DELAY_MILLISECONDS = 30000;

export function reconnectDelayMilliseconds(
  previousRetryCount: number,
  random: () => number = Math.random,
): number {
  const exponential =
    INITIAL_RETRY_DELAY_MILLISECONDS * 2 ** previousRetryCount;
  const capped = Math.min(exponential, MAXIMUM_RETRY_DELAY_MILLISECONDS);

  return Math.round(capped * (0.5 + 0.5 * random()));
}
