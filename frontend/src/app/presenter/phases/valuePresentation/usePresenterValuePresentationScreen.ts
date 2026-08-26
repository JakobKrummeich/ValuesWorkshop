"use client";

import {
  presentationPositionOf,
  type PresentationPosition,
} from "../../../../domain/presentationPosition";
import type { PresenterValuePresentationState } from "../../../../domain/workshopState";

export type PresenterPresentationPosition = PresentationPosition<{
  text: string;
}>;

export function usePresenterValuePresentationScreen(
  state: PresenterValuePresentationState,
): PresenterPresentationPosition | null {
  return presentationPositionOf(state.groups, state.presentation);
}
