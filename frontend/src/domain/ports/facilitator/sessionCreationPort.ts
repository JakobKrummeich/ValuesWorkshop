import type { Single } from "../../../shared/reactiveTypes";
import type { SessionCreationOutcome } from "../../sessionCreation";

export interface FacilitatorSessionCreationPort {
  openSession(
    sessionName: string,
    passphrase: string,
  ): Single<SessionCreationOutcome>;
}
