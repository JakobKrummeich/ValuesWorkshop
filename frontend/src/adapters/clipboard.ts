import { defer, ignoreElements } from "rxjs";
import type { Completable } from "../shared/reactiveTypes";

export function copyToClipboard(text: string): Completable {
  return defer(() => navigator.clipboard.writeText(text)).pipe(
    ignoreElements(),
  );
}
