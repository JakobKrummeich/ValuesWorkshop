"use client";

import {
  FormationSubState,
  type PresenterFormationView,
  type PresenterGroups,
} from "../../../../domain/workshopState";
import { type GroupPages, useGroupPages } from "../../useGroupPages";

export type PresenterGroupFormationScreenModel = GroupPages<
  PresenterGroups[number]
>;

export function usePresenterGroupFormationScreen(
  formation: PresenterFormationView,
): PresenterGroupFormationScreenModel {
  return useGroupPages(
    formation.subState === FormationSubState.Formed ? formation.groups : [],
  );
}
