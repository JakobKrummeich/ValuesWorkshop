import type {
  GroupActionView,
  WorkshopValue,
} from "../../../../domain/workshopState";

export interface ValueSubmission {
  valueId: string;
  actions: Array<{ actionId: string; text: string }>;
}

export function actionsForValue(
  actions: GroupActionView[],
  valueId: string | null,
): GroupActionView[] {
  if (valueId === null) return [];
  return actions
    .filter((action) => action.valueId === valueId)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function resolveActionText(
  action: GroupActionView,
  localTexts: Record<string, string>,
): string {
  const local = localTexts[action.actionId];
  return local !== undefined ? local : action.text;
}

export function everyValueHasNonEmptyAction(
  assignedValues: WorkshopValue[],
  actions: GroupActionView[],
  localTexts: Record<string, string>,
): boolean {
  return assignedValues.every((value) =>
    actions
      .filter((action) => action.valueId === value.valueId)
      .some(
        (action) => resolveActionText(action, localTexts).trim().length > 0,
      ),
  );
}

export function valueSubmissions(
  assignedValues: WorkshopValue[],
  actions: GroupActionView[],
  localTexts: Record<string, string>,
): ValueSubmission[] {
  return assignedValues.map((value) => ({
    valueId: value.valueId,
    actions: actionsForValue(actions, value.valueId).map((action) => ({
      actionId: action.actionId,
      text: resolveActionText(action, localTexts),
    })),
  }));
}
