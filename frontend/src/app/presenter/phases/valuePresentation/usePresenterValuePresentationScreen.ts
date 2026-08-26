"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import type { PresenterValuePresentationState } from "../../../../domain/workshopState";

export enum PresentationPositionKind {
  GroupIntro = "groupIntro",
  PresentedValue = "presentedValue",
}

export type PresenterPresentationPosition =
  | {
      kind: PresentationPositionKind.GroupIntro;
      animalId: string;
      groupName: LocalizedText;
    }
  | {
      kind: PresentationPositionKind.PresentedValue;
      animalId: string;
      groupName: LocalizedText;
      valueName: LocalizedText;
      actionTexts: string[];
    };

export function usePresenterValuePresentationScreen(
  state: PresenterValuePresentationState,
): PresenterPresentationPosition | null {
  const { presentation, groups } = state;

  const presentingGroup = groups.find(
    (group) => group.name.animalId === presentation.presentingGroupName,
  );
  if (presentingGroup === undefined) {
    return null;
  }

  if (presentation.presentedValueId === null) {
    return {
      kind: PresentationPositionKind.GroupIntro,
      animalId: presentingGroup.name.animalId,
      groupName: presentingGroup.name.text,
    };
  }

  const presentedValue = presentingGroup.assignedValues.find(
    (value) => value.valueId === presentation.presentedValueId,
  );
  if (presentedValue === undefined) {
    return null;
  }

  return {
    kind: PresentationPositionKind.PresentedValue,
    animalId: presentingGroup.name.animalId,
    groupName: presentingGroup.name.text,
    valueName: presentedValue.text,
    actionTexts: presentation.presentedActions.map((action) => action.text),
  };
}
