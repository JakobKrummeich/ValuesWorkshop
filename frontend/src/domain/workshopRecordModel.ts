import type { Language } from "./i18n/language";
import { localizedText } from "./i18n/localizedText";
import { MessageKey } from "./i18n/messages";
import { translate } from "./i18n/translate";
import { voteCountMessageKeyOf } from "./i18n/voteCountMessageKey";
import type { WorkshopRecord } from "./workshopStateBlocks";

export interface WorkshopRecordWinnerModel {
  placeLabel: string;
  valueName: string;
  votesLine: string;
  actions: string[];
}

export interface WorkshopRecordValueModel {
  valueName: string;
  actions: string[];
}

export interface WorkshopRecordRoundModel {
  title: string;
  tallyLines: string[];
}

export interface WorkshopRecordModel {
  title: string;
  winnersHeading: string;
  winners: WorkshopRecordWinnerModel[];
  allActionsHeading: string;
  values: WorkshopRecordValueModel[];
  roundsHeading: string;
  rounds: WorkshopRecordRoundModel[];
}

export function buildWorkshopRecord(
  record: WorkshopRecord,
  language: Language,
): WorkshopRecordModel {
  const valueNames = new Map(
    record.values.map((value) => [
      value.valueId,
      localizedText(language, value.text),
    ]),
  );

  return {
    title: translate(language, MessageKey.FinalPresentationRecordTitle),
    winnersHeading: translate(
      language,
      MessageKey.FinalPresentationOverviewHeading,
    ),
    winners: [...record.winners]
      .sort((left, right) => left.place - right.place)
      .map((winner) => winnerModelOf(winner, language)),
    allActionsHeading: translate(
      language,
      MessageKey.FinalPresentationRecordAllActionsHeading,
    ),
    values: record.values.map((value) => ({
      valueName: localizedText(language, value.text),
      actions: [...value.actions],
    })),
    roundsHeading: translate(
      language,
      MessageKey.FinalPresentationRecordRoundsHeading,
    ),
    rounds: [...record.rounds]
      .sort((left, right) => left.roundNumber - right.roundNumber)
      .map((round) => roundModelOf(round, language, valueNames)),
  };
}

function winnerModelOf(
  winner: WorkshopRecord["winners"][number],
  language: Language,
): WorkshopRecordWinnerModel {
  return {
    placeLabel: translate(language, MessageKey.FinalPresentationPlace, {
      place: winner.place,
    }),
    valueName: localizedText(language, winner.text),
    votesLine: translate(language, voteCountMessageKeyOf(winner.voteCount), {
      count: winner.voteCount,
    }),
    actions: [...winner.actions],
  };
}

function roundModelOf(
  round: WorkshopRecord["rounds"][number],
  language: Language,
  valueNames: ReadonlyMap<string, string>,
): WorkshopRecordRoundModel {
  return {
    title:
      round.allotment === 1
        ? translate(
            language,
            MessageKey.FinalPresentationRecordRoundTitleSingle,
            { round: round.roundNumber },
          )
        : translate(language, MessageKey.FinalPresentationRecordRoundTitle, {
            round: round.roundNumber,
            allotment: round.allotment,
          }),
    tallyLines: round.tallies.map(
      (tally) =>
        `${valueNames.get(tally.valueId) ?? tally.valueId} — ${tally.count}`,
    ),
  };
}
