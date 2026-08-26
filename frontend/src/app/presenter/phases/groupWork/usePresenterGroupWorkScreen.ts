"use client";

import { useEffect, useState } from "react";
import { splitIntoGroupPages } from "../../../../domain/groupFormation";
import type { PresenterGroupWorkGroups } from "../../../../domain/workshopState";

export const groupWorkPageCycleMilliseconds = 7000;

export interface PresenterGroupWorkScreenModel {
  currentPageGroups: PresenterGroupWorkGroups;
}

export function usePresenterGroupWorkScreen(
  groups: PresenterGroupWorkGroups,
): PresenterGroupWorkScreenModel {
  const [pageIndex, setPageIndex] = useState(0);
  const pages = splitIntoGroupPages(groups);
  const pageCount = pages.length;

  useEffect(() => {
    if (pageCount <= 1) {
      return undefined;
    }
    const pageTimer = setInterval(
      () => setPageIndex((current) => (current + 1) % pageCount),
      groupWorkPageCycleMilliseconds,
    );
    return () => clearInterval(pageTimer);
  }, [pageCount]);

  return {
    currentPageGroups: pageCount === 0 ? [] : pages[pageIndex % pageCount],
  };
}
