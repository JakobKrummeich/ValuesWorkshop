import { z } from "zod";
import { Language } from "../i18n/language";
import { readStateFixtures } from "../../testing/wireContract";
import type { WorkshopRecord } from "../workshopState";
import { participantConclusionViewSchema } from "../workshopStateBlocks";
import { buildWorkshopRecord } from "../workshopRecordModel";

function workshopRecord(
  overrides: Partial<WorkshopRecord> = {},
): WorkshopRecord {
  return {
    winners: [
      {
        valueId: "wert-2",
        text: { de: "Mut", en: "Courage" },
        place: 2,
        voteCount: 1,
        actions: [],
      },
      {
        valueId: "wert-1",
        text: { de: "Vertrauen", en: "Trust" },
        place: 1,
        voteCount: 6,
        actions: ["We name mistakes the day we make them"],
      },
    ],
    values: [
      {
        valueId: "wert-1",
        text: { de: "Vertrauen", en: "Trust" },
        actions: ["We name mistakes the day we make them"],
      },
      {
        valueId: "wert-2",
        text: { de: "Mut", en: "Courage" },
        actions: [],
      },
    ],
    rounds: [
      {
        roundNumber: 2,
        allotment: 1,
        tallies: [{ valueId: "wert-2", count: 3 }],
      },
      {
        roundNumber: 1,
        allotment: 5,
        tallies: [
          { valueId: "wert-1", count: 6 },
          { valueId: "wert-2", count: 1 },
        ],
      },
    ],
    ...overrides,
  };
}

function contractWorkshopRecord(): WorkshopRecord {
  const fixture = readStateFixtures("participant").find(
    ({ name }) => name === "finalPresentationConcluded",
  );

  const conclusion = z
    .object({ conclusion: participantConclusionViewSchema })
    .parse(fixture?.state).conclusion;

  if (!conclusion.isConcluded) {
    throw new Error("the concluded fixture must carry a record");
  }

  return conclusion.record;
}

describe("buildWorkshopRecord", () => {
  it("translates the section headings into German", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.German);

    expect(model.title).toBe("Workshop-Protokoll");
    expect(model.winnersHeading).toBe("Die Gewinner");
    expect(model.allActionsHeading).toBe("Alle Aktionen");
    expect(model.roundsHeading).toBe("Stimmen pro Runde");
  });

  it("translates the section headings into English", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.English);

    expect(model.title).toBe("Workshop record");
    expect(model.winnersHeading).toBe("The winners");
    expect(model.allActionsHeading).toBe("All actions");
    expect(model.roundsHeading).toBe("Votes per round");
  });

  it("orders the winners by place with labels, votes and actions", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.German);

    expect(model.winners).toEqual([
      {
        placeLabel: "Platz 1",
        valueName: "Vertrauen",
        votesLine: "6 Stimmen",
        actions: ["We name mistakes the day we make them"],
      },
      {
        placeLabel: "Platz 2",
        valueName: "Mut",
        votesLine: "1 Stimme",
        actions: [],
      },
    ]);
  });

  it("renders the winners in English with a singular vote line", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.English);

    expect(model.winners[0].valueName).toBe("Trust");
    expect(model.winners[0].votesLine).toBe("6 votes");
    expect(model.winners[1].votesLine).toBe("1 vote");
  });

  it("keeps the presented values in deal order with their actions", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.English);

    expect(model.values).toEqual([
      {
        valueName: "Trust",
        actions: ["We name mistakes the day we make them"],
      },
      { valueName: "Courage", actions: [] },
    ]);
  });

  it("orders the rounds by number and titles them with the allotment", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.German);

    expect(model.rounds.map((round) => round.title)).toEqual([
      "Runde 1 — 5 Stimmen pro Person",
      "Runde 2 — 1 Stimme pro Person",
    ]);
  });

  it("titles the rounds in English", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.English);

    expect(model.rounds.map((round) => round.title)).toEqual([
      "Round 1 — 5 votes per person",
      "Round 2 — 1 vote per person",
    ]);
  });

  it("writes one tally line per value with its localized name", () => {
    const model = buildWorkshopRecord(workshopRecord(), Language.German);

    expect(model.rounds[0].tallyLines).toEqual(["Vertrauen — 6", "Mut — 1"]);
    expect(model.rounds[1].tallyLines).toEqual(["Mut — 3"]);
  });

  it("falls back to the value id when a tally names no presented value", () => {
    const record = workshopRecord({
      rounds: [
        {
          roundNumber: 1,
          allotment: 5,
          tallies: [{ valueId: "wert-99", count: 2 }],
        },
      ],
    });

    const model = buildWorkshopRecord(record, Language.English);

    expect(model.rounds[0].tallyLines).toEqual(["wert-99 — 2"]);
  });

  it("builds the full model from the backend contract sample", () => {
    const model = buildWorkshopRecord(
      contractWorkshopRecord(),
      Language.German,
    );

    expect(model.winners).toHaveLength(5);
    expect(model.winners[0].placeLabel).toBe("Platz 1");
    expect(model.winners[0].valueName).toBe("Wert 1");
    expect(model.winners[0].votesLine).toBe("6 Stimmen");
    expect(model.winners[0].actions).toEqual([
      "We name mistakes the day we make them",
    ]);
    expect(model.values).toHaveLength(6);
    expect(model.rounds).toHaveLength(2);
    expect(model.rounds[1].tallyLines).toContain("Wert 6 — 3");
  });

  it("carries nothing that could identify a participant or a group", () => {
    const model = buildWorkshopRecord(
      contractWorkshopRecord(),
      Language.English,
    );

    const serialized = JSON.stringify(model);

    expect(serialized).not.toContain("participantId");
    expect(serialized).not.toContain("displayName");
    expect(serialized).not.toContain("groupName");
    expect(serialized).not.toContain("connectionId");
  });
});
