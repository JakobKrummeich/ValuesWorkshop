import { renderHook } from "@testing-library/react";
import type { SelectionResultRow } from "../../domain/selectionResults";
import { useRevealChoreography } from "../useRevealChoreography";
import { useSelectionResultsChart } from "../useSelectionResultsChart";

jest.mock("../useRevealChoreography", () => ({
  useRevealChoreography: jest.fn(),
}));

const choreography = useRevealChoreography as jest.MockedFunction<
  typeof useRevealChoreography
>;

function row(valueId: string): SelectionResultRow {
  return {
    valueId,
    text: { de: valueId, en: valueId },
    count: 1,
    barFraction: 1,
    isTopValue: false,
  };
}

describe("selection results chart model", () => {
  it("numbers the rows across the columns so the bars grow in reading order", () => {
    choreography.mockReturnValue({ labelsVisible: false });

    const { result } = renderHook(() =>
      useSelectionResultsChart([[row("trust"), row("care")], [row("humour")]]),
    );

    expect(choreography).toHaveBeenCalledWith(3);
    expect(result.current.labelsVisible).toBe(false);
    expect(
      result.current.columns.map((column) =>
        column.map(
          ({ row: chartRow, index }) => `${chartRow.valueId}:${index}`,
        ),
      ),
    ).toEqual([["trust:0", "care:1"], ["humour:2"]]);
  });

  it("passes the label visibility through", () => {
    choreography.mockReturnValue({ labelsVisible: true });

    const { result } = renderHook(() => useSelectionResultsChart([]));

    expect(result.current.labelsVisible).toBe(true);
    expect(result.current.columns).toEqual([]);
  });
});
