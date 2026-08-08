import { render, screen } from "@testing-library/react";
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
  [Phase.Join]: ({ state }) => <p>lobby of {state.ownDisplayName}</p>,
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

describe("phase view", () => {
  it("renders nothing until the first state arrives", () => {
    phaseState.mockReturnValue(null);

    const { container } = render(
      <PhaseView sessionStatePort={port} components={components} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the component the current phase maps to", () => {
    phaseState.mockReturnValue({
      revision: 4,
      phase: Phase.Join,
      participantCount: 1,
      ownDisplayName: "Ada Lovelace",
    });

    render(<PhaseView sessionStatePort={port} components={components} />);

    screen.getByText("lobby of Ada Lovelace");
  });

  it("renders nothing for a phase that has no screen yet", () => {
    phaseState.mockReturnValue({
      revision: 4,
      phase: Phase.GroupWork,
      participantCount: 1,
      ownGroup: null,
    });

    const { container } = render(
      <PhaseView sessionStatePort={port} components={components} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
