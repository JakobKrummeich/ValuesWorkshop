import { render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../testing/languageWrapper";
import { PresenterGroupGrid } from "../PresenterGroupGrid";

const groups = [
  {
    name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
    memberDisplayNames: ["Ada"],
    assignedValues: [
      { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
    ],
    isReady: true,
  },
  {
    name: { animalId: "fuchs", text: { de: "Fuchs", en: "Fox" } },
    memberDisplayNames: ["Grace"],
    assignedValues: [],
    isReady: false,
  },
];

describe("presenter group grid", () => {
  it("lays out one wall card per group, staggered by position", () => {
    render(<PresenterGroupGrid pageIndex={0} groups={groups} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-card-otter")).toHaveStyle({
      "--index": "0",
    });
    expect(screen.getByTestId("group-card-fuchs")).toHaveStyle({
      "--index": "1",
    });
  });

  it("hands every card the status its group earns", () => {
    render(
      <PresenterGroupGrid
        pageIndex={1}
        groups={groups}
        statusOf={(group) =>
          group.isReady ? <span data-testid="ready">Ready</span> : undefined
        }
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("group-card-otter")).toContainElement(
      screen.getByTestId("ready"),
    );
    expect(screen.getAllByTestId("ready")).toHaveLength(1);
  });
});
