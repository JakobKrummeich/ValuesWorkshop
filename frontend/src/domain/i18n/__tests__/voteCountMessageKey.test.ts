import { Language } from "../language";
import { MessageKey } from "../messages";
import { translate } from "../translate";
import { voteCountMessageKeyOf } from "../voteCountMessageKey";

describe("voteCountMessageKeyOf", () => {
  it("picks the singular key for exactly one vote", () => {
    expect(voteCountMessageKeyOf(1)).toBe(MessageKey.VoteCountSingle);
  });

  it.each([0, 2, 14, 30])("picks the plural key for %i votes", (count) => {
    expect(voteCountMessageKeyOf(count)).toBe(MessageKey.VoteCount);
  });

  it("renders the count in both languages", () => {
    expect(
      translate(Language.English, voteCountMessageKeyOf(14), { count: 14 }),
    ).toBe("14 votes");
    expect(
      translate(Language.German, voteCountMessageKeyOf(14), { count: 14 }),
    ).toBe("14 Stimmen");
    expect(
      translate(Language.English, voteCountMessageKeyOf(1), { count: 1 }),
    ).toBe("1 vote");
    expect(
      translate(Language.German, voteCountMessageKeyOf(1), { count: 1 }),
    ).toBe("1 Stimme");
  });
});
