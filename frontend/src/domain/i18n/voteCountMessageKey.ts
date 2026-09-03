import { MessageKey } from "./messages";

export function voteCountMessageKeyOf(voteCount: number): MessageKey {
  return voteCount === 1 ? MessageKey.VoteCountSingle : MessageKey.VoteCount;
}
