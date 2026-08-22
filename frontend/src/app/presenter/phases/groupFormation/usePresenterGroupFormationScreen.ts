"use client";

import { useCallback, useEffect, useState } from "react";
import { splitIntoGroupPages } from "../../../../domain/groupFormation";
import type { PresenterGroupFormationState } from "../../../../domain/workshopState";

export const groupPageCycleMilliseconds = 7000;

type PresenterGroups = PresenterGroupFormationState["groups"];

export interface PresenterGroupFormationScreenModel {
  isFormationProgressRunning: boolean;
  completeFormationProgress: () => void;
  currentPageGroups: PresenterGroups;
}

export function usePresenterGroupFormationScreen(
  groups: PresenterGroups,
  isPhaseEntryObserved: boolean,
): PresenterGroupFormationScreenModel {
  const [isFormationProgressRunning, setIsFormationProgressRunning] =
    useState(isPhaseEntryObserved);
  const [pageIndex, setPageIndex] = useState(0);
  const pages = splitIntoGroupPages(groups);
  const pageCount = pages.length;

  const completeFormationProgress = useCallback(
    () => setIsFormationProgressRunning(false),
    [],
  );

  useEffect(() => {
    if (isFormationProgressRunning || pageCount <= 1) {
      return undefined;
    }
    const pageTimer = setInterval(
      () => setPageIndex((current) => (current + 1) % pageCount),
      groupPageCycleMilliseconds,
    );
    return () => clearInterval(pageTimer);
  }, [isFormationProgressRunning, pageCount]);

  return {
    isFormationProgressRunning,
    completeFormationProgress,
    currentPageGroups: pageCount === 0 ? [] : pages[pageIndex % pageCount],
  };
}
