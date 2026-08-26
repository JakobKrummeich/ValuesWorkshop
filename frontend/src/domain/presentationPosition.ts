import type { LocalizedText } from "./i18n/localizedText";
import type { GroupName, WorkshopValue } from "./workshopStateBlocks";

export enum PresentationPositionKind {
  GroupIntro = "groupIntro",
  PresentedValue = "presentedValue",
}

export interface PresentingGroup {
  name: GroupName;
  assignedValues: WorkshopValue[];
}

export type PresentationPosition<TAction> =
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
      actions: TAction[];
    };

export function presentationPositionOf<TAction>(
  groups: readonly PresentingGroup[],
  presentation: {
    presentingGroupName: string | null;
    presentedValueId: string | null;
    presentedActions: TAction[];
  },
): PresentationPosition<TAction> | null {
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
    actions: presentation.presentedActions,
  };
}
