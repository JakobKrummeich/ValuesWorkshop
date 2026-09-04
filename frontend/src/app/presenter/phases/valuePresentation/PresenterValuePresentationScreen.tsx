"use client";

import { PresentationPositionKind } from "../../../../domain/presentationPosition";
import type { PresenterValuePresentationState } from "../../../../domain/workshopState";
import { GroupIntroView } from "./GroupIntroView";
import { PresentedValueView } from "./PresentedValueView";
import { presenterValuePresentationModelOf } from "./presenterValuePresentationModel";

export function PresenterValuePresentationScreen({
  state,
}: {
  state: PresenterValuePresentationState;
}) {
  const position = presenterValuePresentationModelOf(state);

  if (position === null) {
    return null;
  }

  if (position.kind === PresentationPositionKind.GroupIntro) {
    return (
      <GroupIntroView
        key={position.animalId}
        animalId={position.animalId}
        groupName={position.groupName}
      />
    );
  }

  return (
    <PresentedValueView
      key={`${position.animalId}-${position.valueId}`}
      animalId={position.animalId}
      groupName={position.groupName}
      valueName={position.valueName}
      actions={position.actions}
    />
  );
}
