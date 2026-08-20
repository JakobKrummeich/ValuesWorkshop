"use client";

import { useEffect, useState } from "react";
import { splitIntoGroupPages } from "../../../../domain/groupFormation";
import type { PresenterGroupFormationState } from "../../../../domain/workshopState";

export const groupPageCycleMilliseconds = 7000;

type PresenterGroups = PresenterGroupFormationState["groups"];

export interface PresenterGroupFormationScreenModel {
  currentPageGroups: PresenterGroups;
}

export function usePresenterGroupFormationScreen(
  groups: PresenterGroups,
): PresenterGroupFormationScreenModel {
  const [pageIndex, setPageIndex] = useState(0);
  const pages = splitIntoGroupPages(groups);
  const pageCount = pages.length;

  useEffect(() => {
    if (pageCount <= 1) {
      return undefined;
    }
    const pageTimer = setInterval(
      () => setPageIndex((current) => (current + 1) % pageCount),
      groupPageCycleMilliseconds,
    );
    return () => clearInterval(pageTimer);
  }, [pageCount]);

  return {
    currentPageGroups: pageCount === 0 ? [] : pages[pageIndex % pageCount],
  };
}
