/** Driven port: source of the current time (mirrors BE Ports/Driven). */
export interface Clock {
  now(): Date;
}
