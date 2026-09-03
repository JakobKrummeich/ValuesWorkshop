import { act, render, screen } from "@testing-library/react";
import { NEVER, Subject } from "rxjs";
import { Phase } from "../../../domain/phases";
import {
  FormationSubState,
  type ParticipantWorkshopState,
} from "../../../domain/workshopState";
import {
  OwnGroupMemoryProvider,
  useRememberedOwnGroup,
} from "../OwnGroupMemoryProvider";

function RememberedGroup() {
  const ownGroup = useRememberedOwnGroup();

  return <p data-testid="remembered">{ownGroup?.animalId ?? "none"}</p>;
}

describe("own group memory provider", () => {
  it("hands the remembered group to its descendants", () => {
    const workshopState = new Subject<ParticipantWorkshopState>();
    render(
      <OwnGroupMemoryProvider
        sessionStatePort={{ workshopState, connectionState: NEVER }}
      >
        <RememberedGroup />
      </OwnGroupMemoryProvider>,
    );
    expect(screen.getByTestId("remembered")).toHaveTextContent("none");

    act(() =>
      workshopState.next({
        revision: 1,
        participantCount: 3,
        phase: Phase.GroupFormation,
        formation: {
          subState: FormationSubState.Formed,
          ownGroup: {
            name: { animalId: "eule", text: { de: "Eule", en: "Owl" } },
            memberDisplayNames: [],
            assignedValues: [],
          },
        },
      }),
    );

    expect(screen.getByTestId("remembered")).toHaveTextContent("eule");
  });

  it("knows no group outside the provider", () => {
    render(<RememberedGroup />);

    expect(screen.getByTestId("remembered")).toHaveTextContent("none");
  });
});
