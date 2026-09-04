import { Language } from "../language";
import type { Message } from "../message";
import { MessageKey } from "../messageKey";

export const groupWorkMessages = {
  [MessageKey.GroupWorkScribeLabel]: {
    [Language.German]: "Schreiber/in: {name}",
    [Language.English]: "Scribe: {name}",
  },
  [MessageKey.GroupWorkScribeIsYou]: {
    [Language.German]: "Schreiber/in: {name} (du)",
    [Language.English]: "Scribe: {name} (you)",
  },
  [MessageKey.GroupWorkAddAction]: {
    [Language.German]: "Aktion hinzufügen",
    [Language.English]: "Add action",
  },
  [MessageKey.GroupWorkRemoveAction]: {
    [Language.German]: "Entfernen",
    [Language.English]: "Remove",
  },
  [MessageKey.GroupWorkActionPlaceholder]: {
    [Language.German]: "Aktion beschreiben\u2026",
    [Language.English]: "Describe an action\u2026",
  },
  [MessageKey.GroupWorkNoActionsYet]: {
    [Language.German]: "Noch keine Aktionen.",
    [Language.English]: "No actions yet.",
  },
  [MessageKey.GroupWorkSubmit]: {
    [Language.German]: "Ergebnis abgeben",
    [Language.English]: "Submit result",
  },
  [MessageKey.GroupWorkReopen]: {
    [Language.German]: "Ergebnis zurücknehmen",
    [Language.English]: "Reopen result",
  },
  [MessageKey.GroupWorkSubmitDisabledHint]: {
    [Language.German]:
      "Jeder zugewiesene Wert braucht mindestens eine Aktion mit Text.",
    [Language.English]:
      "Every assigned value needs at least one action with text.",
  },
  [MessageKey.GroupWorkStatusEditing]: {
    [Language.German]: "In Bearbeitung",
    [Language.English]: "Editing",
  },
  [MessageKey.GroupWorkStatusSubmitted]: {
    [Language.German]: "Abgegeben",
    [Language.English]: "Submitted",
  },
  [MessageKey.GroupWorkGroupName]: {
    [Language.German]: "Gruppenname",
    [Language.English]: "Group name",
  },
  [MessageKey.GroupWorkScribe]: {
    [Language.German]: "Schreiber/in",
    [Language.English]: "Scribe",
  },
  [MessageKey.GroupWorkActions]: {
    [Language.German]: "Aktionen",
    [Language.English]: "Actions",
  },
  [MessageKey.GroupWorkStatus]: {
    [Language.German]: "Status",
    [Language.English]: "Status",
  },
} as const satisfies Partial<Readonly<Record<MessageKey, Message>>>;
