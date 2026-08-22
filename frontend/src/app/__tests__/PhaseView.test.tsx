import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { NEVER } from "rxjs";
import { Phase } from "../../domain/phases";
import type { SessionStatePort } from "../../domain/ports/sessionStatePort";
import type { ParticipantWorkshopState } from "../../domain/workshopState";
import { EmptyPhase } from "../EmptyPhase";
import { PhaseView, type PhaseComponents } from "../PhaseView";
import { usePhaseView } from "../usePhaseView";

jest.mock("../usePhaseView", () => ({
  usePhaseView: jest.fn(),
}));

const phaseState = usePhaseView as jest.MockedFunction<
  typeof usePhaseView<ParticipantWorkshopState>
>;

const components: PhaseComponents<ParticipantWorkshopState> = {
  [Phase.Join]: ({ state, isPhaseEntryObserved }) => (
    <p>
      lobby of {state.ownDisplayName}
      {isPhaseEntryObserved ? " just entered" : " already running"}
    </p>
  ),
  [Phase.Quiz]: EmptyPhase,
  [Phase.ValueSelection]: EmptyPhase,
  [Phase.SelectionResults]: EmptyPhase,
  [Phase.GroupFormation]: EmptyPhase,
  [Phase.GroupWork]: EmptyPhase,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};

const port: SessionStatePort<ParticipantWorkshopState> = {
  workshopState: NEVER,
  connectionState: NEVER,
};

const joinState: ParticipantWorkshopState = {
  revision: 4,
  phase: Phase.Join,
  participantCount: 1,
  ownDisplayName: "Ada Lovelace",
};

const emptySelection = {
  values: [],
  ownSelectedValueIds: [],
  isSubmitted: false,
};

function phaseView(
  phaseComponents: PhaseComponents<ParticipantWorkshopState> = components,
) {
  return <PhaseView sessionStatePort={port} components={phaseComponents} />;
}

describe("phase view", () => {
  it("renders nothing until the first state arrives", () => {
    phaseState.mockReturnValue({ state: null, isPhaseEntryObserved: false });

    const { container } = render(phaseView());

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the component the current phase maps to", () => {
    phaseState.mockReturnValue({
      state: joinState,
      isPhaseEntryObserved: false,
    });

    render(phaseView());

    screen.getByText("lobby of Ada Lovelace already running");
  });

  it("tells the phase component that it watched the phase begin", () => {
    phaseState.mockReturnValue({
      state: joinState,
      isPhaseEntryObserved: true,
    });

    render(phaseView());

    screen.getByText("lobby of Ada Lovelace just entered");
  });

  it("gives every phase its own instance of a shared screen", () => {
    let instanceCount = 0;
    function CountingPhase() {
      const [instance] = useState(() => ++instanceCount);
      return <p>instance {instance}</p>;
    }
    const sharedScreen = {
      ...components,
      [Phase.ValueSelection]: CountingPhase,
      [Phase.SelectionResults]: CountingPhase,
    };
    phaseState.mockReturnValue({
      state: {
        revision: 4,
        phase: Phase.ValueSelection,
        participantCount: 1,
        selection: emptySelection,
      },
      isPhaseEntryObserved: false,
    });

    const { rerender } = render(phaseView(sharedScreen));
    screen.getByText("instance 1");

    phaseState.mockReturnValue({
      state: {
        revision: 5,
        phase: Phase.SelectionResults,
        participantCount: 1,
        selection: emptySelection,
      },
      isPhaseEntryObserved: true,
    });
    rerender(phaseView(sharedScreen));

    screen.getByText("instance 2");
  });

  it("renders nothing for a phase that has no screen yet", () => {
    phaseState.mockReturnValue({
      state: {
        revision: 4,
        phase: Phase.GroupWork,
        participantCount: 1,
        ownGroup: null,
      },
      isPhaseEntryObserved: false,
    });

    const { container } = render(phaseView());

    expect(container).toBeEmptyDOMElement();
  });
});
