import { z } from "zod";

export const mutationRecordPath = "docs/quality/mutation.json";

export const MutationSide = {
  Frontend: "frontend",
  Backend: "backend",
} as const;

export type MutationSide = (typeof MutationSide)[keyof typeof MutationSide];

export const mutationCommands: Record<MutationSide, string> = {
  [MutationSide.Frontend]: "pnpm mutation:frontend",
  [MutationSide.Backend]: "pnpm mutation:backend",
};

const measurementSchema = z.object({
  tool: z.string(),
  command: z.string(),
  commit: z.string(),
  measuredAt: z.string(),
  score: z.number(),
  killed: z.number(),
  survived: z.number(),
  timeout: z.number(),
  noCoverage: z.number(),
});

const mutationRecordSchema = z.object({
  frontend: measurementSchema.optional(),
  backend: measurementSchema.optional(),
});

export type MutationMeasurement = z.infer<typeof measurementSchema>;
export type MutationRecord = z.infer<typeof mutationRecordSchema>;

export function parseMutationRecord(recordJson: string): MutationRecord {
  return mutationRecordSchema.parse(JSON.parse(recordJson));
}

export function renderMutationRecord(record: MutationRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function recordMeasurement(
  record: MutationRecord,
  side: MutationSide,
  measurement: MutationMeasurement,
): MutationRecord {
  const merged = { ...record, [side]: measurement };
  return { frontend: merged.frontend, backend: merged.backend };
}
