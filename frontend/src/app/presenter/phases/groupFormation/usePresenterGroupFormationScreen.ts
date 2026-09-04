"use client";

import {
  FormationSubState,
  type PresenterFormationView,
  type PresenterGroup,
} from "../../../../domain/workshopState";
import { type GroupPages, useGroupPages } from "../../useGroupPages";

export type PresenterGroupFormationScreenModel = GroupPages<PresenterGroup>;

export function usePresenterGroupFormationScreen(
  formation: PresenterFormationView,
): PresenterGroupFormationScreenModel {
  return useGroupPages(
    formation.subState === FormationSubState.Formed ? formation.groups : [],
  );
}
