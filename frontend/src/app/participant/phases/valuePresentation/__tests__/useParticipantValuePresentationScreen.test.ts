import { renderHook } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type {
  OwnGroupView,
  ParticipantValuePresentationState,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { useParticipantValuePresentationScreen } from "../useParticipantValuePresentationScreen";

const ownGroup: OwnGroupView = {
  name: { animalId: "fuchs", text: { de: "Fuchs", en: "Fox" } },
  memberDisplayNames: ["Ada"],
  assignedValues: [
    { valueId: "curiosity", text: { de: "Neugier", en: "Curiosity" } },
  ],
};

function state(
  presentingGroupName: string | null,
  presentedValueId: string | null,
  group: OwnGroupView | null = ownGroup,
): ParticipantValuePresentationState {
  return {
    phase: Phase.ValuePresentation,
    revision: 3,
    participantCount: 12,
    ownGroup: group,
    presentation: {
      presentingGroupName,
      presentedValueId,
      presentedActions: [],
    },
  };
}

function copyFor(
  presentationState: ParticipantValuePresentationState,
  language?: Language,
) {
  return renderHook(
    () => useParticipantValuePresentationScreen(presentationState),
    { wrapper: languageWrapper(language) },
  ).result.current;
}

describe("participant value presentation copy", () => {
  it("asks to listen while another group presents", () => {
    expect(copyFor(state("otter", "trust"))).toEqual({
      heading: MessageKey.WaitingListenToGroups,
    });
  });

  it("asks to listen while nobody presents yet", () => {
    expect(copyFor(state(null, null))).toEqual({
      heading: MessageKey.WaitingListenToGroups,
    });
  });

  it("asks to listen when the participant has no group", () => {
    expect(copyFor(state("fuchs", "curiosity", null))).toEqual({
      heading: MessageKey.WaitingListenToGroups,
    });
  });

  it("calls the own group up during its intro", () => {
    expect(copyFor(state("fuchs", null))).toEqual({
      heading: MessageKey.WaitingOwnGroupUp,
    });
  });

  it("names the own group's presented value in the chosen language", () => {
    expect(copyFor(state("fuchs", "curiosity"))).toEqual({
      heading: MessageKey.WaitingOwnGroupUp,
      body: MessageKey.WaitingGroupPresents,
      bodyParameters: { group: "Fox", value: "Curiosity" },
    });
    expect(copyFor(state("fuchs", "curiosity"), Language.German)).toEqual({
      heading: MessageKey.WaitingOwnGroupUp,
      body: MessageKey.WaitingGroupPresents,
      bodyParameters: { group: "Fuchs", value: "Neugier" },
    });
  });

  it("falls back to the plain call-up when the presented value is not the group's own", () => {
    expect(copyFor(state("fuchs", "trust"))).toEqual({
      heading: MessageKey.WaitingOwnGroupUp,
    });
  });
});
