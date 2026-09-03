import { MessageKey } from "../../../../domain/i18n/messages";
import { WaitingScreen } from "../../../WaitingScreen";

export function ParticipantSelectionResultsScreen() {
  return (
    <WaitingScreen
      heading={MessageKey.WaitingEyesUpFront}
      body={MessageKey.WaitingResultsOnScreen}
    />
  );
}
