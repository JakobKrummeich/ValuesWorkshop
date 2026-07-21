export const PHASES = [
  "join",
  "quiz",
  "valueSelection",
  "selectionResults",
  "groupFormation",
  "groupWork",
  "valuePresentation",
  "finalVoting",
  "finalPresentation",
] as const;

export type Phase = (typeof PHASES)[number];
