import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mutationRecordPath,
  parseMutationRecord,
  type MutationRecord,
} from "./mutationRecord.mts";

export function readMutationRecord(repositoryRoot: string): MutationRecord {
  const file = resolve(repositoryRoot, mutationRecordPath);
  return existsSync(file)
    ? parseMutationRecord(readFileSync(file, "utf8"))
    : {};
}
