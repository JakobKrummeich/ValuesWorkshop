export const ColumnAlignment = {
  Left: "left",
  Right: "right",
} as const;

export type ColumnAlignment =
  (typeof ColumnAlignment)[keyof typeof ColumnAlignment];

const alignmentRule: Record<ColumnAlignment, string> = {
  left: "---",
  right: "---:",
};

const counts = new Intl.NumberFormat("en-US");

export function formatCount(value: number): string {
  return counts.format(value);
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function formatAtMost(value: number): string {
  return `at most ${formatCount(value)}`;
}

export function formatAtLeastPercentage(value: number): string {
  return `at least ${value}%`;
}

export function formatAtMostPercentage(value: number): string {
  return `at most ${value}%`;
}

function row(cells: readonly string[]): string {
  return `| ${cells.join(" | ")} |`;
}

export function markdownTable(
  headers: readonly string[],
  alignments: readonly ColumnAlignment[],
  rows: readonly (readonly string[])[],
): string {
  return [
    row(headers),
    row(alignments.map((alignment) => alignmentRule[alignment])),
    ...rows.map(row),
  ].join("\n");
}

export function commandList(commands: readonly string[]): string {
  return commands.map((command) => `- \`${command}\``).join("\n");
}

export function section(
  title: string,
  commands: readonly string[],
  blocks: readonly string[],
): string {
  return [`## ${title}`, "Produced by:", commandList(commands), ...blocks].join(
    "\n\n",
  );
}

export function measureTable(rows: readonly (readonly string[])[]): string {
  return markdownTable(
    ["measure", "value"],
    [ColumnAlignment.Left, ColumnAlignment.Right],
    rows,
  );
}
