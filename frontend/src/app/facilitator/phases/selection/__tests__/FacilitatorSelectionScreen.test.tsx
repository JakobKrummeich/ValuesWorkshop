import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorSelectionState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorSelectionScreen } from "../FacilitatorSelectionScreen";

function state(submittedCount: number): FacilitatorSelectionState {
  return {
    phase: Phase.ValueSelection,
    revision: 11,
    roster: {
      participants: [
        { participantId: "participant-1", displayName: "Ada" },
        { participantId: "participant-2", displayName: "Grace" },
        { participantId: "participant-3", displayName: "Edsger" },
      ],
      participantCount: 3,
    },
    enabledIntents: [],
    selection: {
      values: [{ valueId: "trust", text: { de: "Vertrauen", en: "Trust" } }],
      submittedCount,
    },
  };
}

describe("facilitator selection screen", () => {
  it("shows the phase prompt", () => {
    render(<FacilitatorSelectionScreen state={state(0)} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Pick your 10 values");
  });

  it("shows the submission progress against the roster count", () => {
    render(<FacilitatorSelectionScreen state={state(2)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "2 of 3 have submitted",
    );
  });

  it("starts the progress at zero", () => {
    render(<FacilitatorSelectionScreen state={state(0)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "0 of 3 have submitted",
    );
  });

  it("fills the ring with the submitted share", () => {
    render(<FacilitatorSelectionScreen state={state(2)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("selection-progress")).toHaveAttribute(
      "aria-valuenow",
      "67",
    );
  });

  it("keeps the ring empty while nobody could submit yet", () => {
    const nobody = state(0);
    nobody.roster = { participants: [], participantCount: 0 };

    render(<FacilitatorSelectionScreen state={nobody} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("selection-progress")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("reports a complete submission round", () => {
    render(<FacilitatorSelectionScreen state={state(3)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "3 of 3 have submitted",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<FacilitatorSelectionScreen state={state(2)} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByText("Wählt eure 10 Werte");
    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "2 von 3 haben abgegeben",
    );
  });
});
