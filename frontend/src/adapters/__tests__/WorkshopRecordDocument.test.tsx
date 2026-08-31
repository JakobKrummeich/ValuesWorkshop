import { render, screen, within } from "@testing-library/react";
import type { WorkshopRecordModel } from "../../domain/workshopRecordModel";
import { WorkshopRecordDocument } from "../WorkshopRecordDocument";

jest.mock("@react-pdf/renderer", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const passthrough =
    (testId?: string) =>
    ({ children }: { children?: React.ReactNode }) =>
      createElement("div", { "data-testid": testId }, children);

  return {
    Document: passthrough(),
    Page: passthrough("pdf-page"),
    Text: passthrough(),
    View: passthrough(),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

const model: WorkshopRecordModel = {
  title: "Workshop-Protokoll",
  winnersHeading: "Die Gewinner",
  winners: [
    {
      placeLabel: "Platz 1",
      valueName: "Vertrauen",
      votesLine: "6 Stimmen",
      actions: ["We name mistakes the day we make them"],
    },
  ],
  allActionsHeading: "Alle Aktionen",
  values: [
    { valueName: "Vertrauen", actions: ["We ask before we assume"] },
    { valueName: "Mut", actions: [] },
  ],
  roundsHeading: "Stimmen pro Runde",
  rounds: [
    {
      title: "Runde 1 — 5 Stimmen pro Person",
      tallyLines: ["Vertrauen — 6", "Mut — 1"],
    },
  ],
};

describe("workshop record document", () => {
  it("starts each section on its own page", () => {
    render(<WorkshopRecordDocument model={model} />);

    const pages = screen.getAllByTestId("pdf-page");
    expect(pages).toHaveLength(3);
    expect(within(pages[0]).getByText("Die Gewinner")).toBeInTheDocument();
    expect(within(pages[1]).getByText("Alle Aktionen")).toBeInTheDocument();
    expect(within(pages[2]).getByText("Stimmen pro Runde")).toBeInTheDocument();
  });

  it("prints the title and every winner detail", () => {
    render(<WorkshopRecordDocument model={model} />);

    expect(screen.getByText("Workshop-Protokoll")).toBeInTheDocument();
    expect(screen.getByText("Platz 1")).toBeInTheDocument();
    expect(screen.getByText("6 Stimmen")).toBeInTheDocument();
    expect(
      screen.getByText("We name mistakes the day we make them"),
    ).toBeInTheDocument();
  });

  it("prints every presented value with its actions", () => {
    render(<WorkshopRecordDocument model={model} />);

    const actionsPage = screen.getAllByTestId("pdf-page")[1];
    expect(within(actionsPage).getByText("Vertrauen")).toBeInTheDocument();
    expect(within(actionsPage).getByText("Mut")).toBeInTheDocument();
    expect(
      within(actionsPage).getByText("We ask before we assume"),
    ).toBeInTheDocument();
  });

  it("prints the round titles and tally lines", () => {
    render(<WorkshopRecordDocument model={model} />);

    expect(
      screen.getByText("Runde 1 — 5 Stimmen pro Person"),
    ).toBeInTheDocument();
    expect(screen.getByText("Vertrauen — 6")).toBeInTheDocument();
    expect(screen.getByText("Mut — 1")).toBeInTheDocument();
  });
});
