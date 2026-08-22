import { act, render, screen } from "@testing-library/react";
import { NEVER, Subject } from "rxjs";
import { Phase } from "../../domain/phases";
import type { ParticipantWorkshopState } from "../../domain/workshopState";
import { languageWrapper } from "../../testing/languageWrapper";
import { participantPhaseView } from "../participant/phases/phaseView";
import { PhaseView } from "../PhaseView";

const selectionResults: ParticipantWorkshopState = {
  phase: Phase.SelectionResults,
  revision: 29,
  participantCount: 3,
  selection: { values: [], ownSelectedValueIds: [], isSubmitted: true },
};

function groupFormation(revision: number): ParticipantWorkshopState {
  return {
    phase: Phase.GroupFormation,
    revision,
    participantCount: 3,
    ownGroup: {
      name: { animalId: "fox", text: { de: "Fuchs", en: "Fox" } },
      memberDisplayNames: ["Ada"],
      assignedValues: [],
    },
  };
}

function renderPhaseView(workshopState: Subject<ParticipantWorkshopState>) {
  return render(
    <PhaseView
      sessionStatePort={{ workshopState, connectionState: NEVER }}
      components={participantPhaseView}
    />,
    { wrapper: languageWrapper() },
  );
}

describe("watching a phase begin", () => {
  it("runs the progress bar on the phase it watched begin", () => {
    const workshopState = new Subject<ParticipantWorkshopState>();
    renderPhaseView(workshopState);

    act(() => workshopState.next(selectionResults));
    act(() => workshopState.next(groupFormation(30)));

    expect(screen.getByTestId("formation-progress")).toBeInTheDocument();
  });

  it("runs the progress bar when a later state follows in the same batch", () => {
    const workshopState = new Subject<ParticipantWorkshopState>();
    renderPhaseView(workshopState);

    act(() => workshopState.next(selectionResults));
    act(() => {
      workshopState.next(groupFormation(30));
      workshopState.next(groupFormation(31));
    });

    expect(screen.getByTestId("formation-progress")).toBeInTheDocument();
  });

  it("shows the group right away on a phase that was already running", () => {
    const workshopState = new Subject<ParticipantWorkshopState>();
    renderPhaseView(workshopState);

    act(() => workshopState.next(groupFormation(30)));

    expect(screen.queryByTestId("formation-progress")).not.toBeInTheDocument();
    expect(screen.getByTestId("own-group-card")).toBeInTheDocument();
  });
});
