"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { MessageParameters } from "../../../../domain/i18n/translate";
import type { ParticipantValuePresentationState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";

export interface WaitingCopy {
  heading: MessageKey;
  body?: MessageKey;
  bodyParameters?: MessageParameters;
}

export function useParticipantValuePresentationScreen({
  ownGroup,
  presentation,
}: ParticipantValuePresentationState): WaitingCopy {
  const { language } = useTranslation();

  if (
    ownGroup === null ||
    presentation.presentingGroupName !== ownGroup.name.animalId
  ) {
    return { heading: MessageKey.WaitingListenToGroups };
  }

  const presentedValue = ownGroup.assignedValues.find(
    (value) => value.valueId === presentation.presentedValueId,
  );
  if (presentedValue === undefined) {
    return { heading: MessageKey.WaitingOwnGroupUp };
  }

  return {
    heading: MessageKey.WaitingOwnGroupUp,
    body: MessageKey.WaitingGroupPresents,
    bodyParameters: {
      group: localizedText(language, ownGroup.name.text),
      value: localizedText(language, presentedValue.text),
    },
  };
}
