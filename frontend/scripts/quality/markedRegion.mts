interface RegionBounds {
  contentStart: number;
  contentEnd: number;
}

function countOccurrences(document: string, marker: string): number {
  return document.split(marker).length - 1;
}

function startMarkerOf(name: string): string {
  return `<!-- quality:${name}:start -->`;
}

function endMarkerOf(name: string): string {
  return `<!-- quality:${name}:end -->`;
}

function boundsOf(document: string, name: string): RegionBounds {
  const startMarker = startMarkerOf(name);
  const endMarker = endMarkerOf(name);
  const starts = countOccurrences(document, startMarker);
  const ends = countOccurrences(document, endMarker);
  const startIndex = document.indexOf(startMarker);
  const endIndex = document.indexOf(endMarker);
  if (starts !== 1 || ends !== 1 || endIndex < startIndex) {
    throw new Error(
      `The document has no region "${name}": expected exactly one "${startMarker}" and one "${endMarker}" after it, found ${starts} and ${ends}.`,
    );
  }
  return {
    contentStart: startIndex + startMarker.length,
    contentEnd: endIndex,
  };
}

export function replaceMarkedRegion(
  document: string,
  name: string,
  content: string,
): string {
  const bounds = boundsOf(document, name);
  return `${document.slice(0, bounds.contentStart)}\n${content}\n${document.slice(bounds.contentEnd)}`;
}

export function readMarkedRegion(document: string, name: string): string {
  const bounds = boundsOf(document, name);
  return document
    .slice(bounds.contentStart, bounds.contentEnd)
    .replace(/^\n/, "")
    .replace(/\n$/, "");
}
