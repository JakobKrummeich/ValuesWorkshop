import type { SessionStatePort } from "../sessionStatePort";
import type { PresenterWorkshopState } from "../../workshopState";

export type PresenterSessionStatePort =
  SessionStatePort<PresenterWorkshopState>;
