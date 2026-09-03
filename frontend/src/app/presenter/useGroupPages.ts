"use client";

import { useEffect, useState } from "react";
import { splitIntoGroupPages } from "../../domain/groupFormation";

export const groupPageCycleMilliseconds = 7000;

export interface GroupPages<TGroup> {
  pageIndex: number;
  currentPageGroups: TGroup[];
}

export function useGroupPages<TGroup>(
  groups: readonly TGroup[],
): GroupPages<TGroup> {
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

  const currentPageIndex = pageCount === 0 ? 0 : pageIndex % pageCount;

  return {
    pageIndex: currentPageIndex,
    currentPageGroups: pageCount === 0 ? [] : pages[currentPageIndex],
  };
}
