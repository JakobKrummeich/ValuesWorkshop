import fc from "fast-check";
import { MessageKey } from "../messages";
import { voteCountMessageKeyOf } from "../voteCountMessageKey";

describe("the vote count message key, for any count", () => {
  it("is the singular one exactly at one vote", () => {
    fc.assert(
      fc.property(fc.integer(), (voteCount) => {
        expect(
          voteCountMessageKeyOf(voteCount) === MessageKey.VoteCountSingle,
        ).toBe(voteCount === 1);
      }),
    );
  });

  it("is always a key the message tables know", () => {
    fc.assert(
      fc.property(fc.integer(), (voteCount) => {
        expect([MessageKey.VoteCount, MessageKey.VoteCountSingle]).toContain(
          voteCountMessageKeyOf(voteCount),
        );
      }),
    );
  });
});
