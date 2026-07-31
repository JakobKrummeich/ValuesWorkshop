import type { SessionStatePort } from "../sessionStatePort";
import type { ParticipantWorkshopState } from "../../workshopState";

export type ParticipantSessionStatePort =
  SessionStatePort<ParticipantWorkshopState>;
