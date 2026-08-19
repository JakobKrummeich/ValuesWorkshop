export const groupPageCapacity = 6;

export function splitIntoGroupPages<TGroup>(
  groups: readonly TGroup[],
): TGroup[][] {
  const pages: TGroup[][] = [];
  for (let start = 0; start < groups.length; start += groupPageCapacity) {
    pages.push(groups.slice(start, start + groupPageCapacity));
  }
  return pages;
}
