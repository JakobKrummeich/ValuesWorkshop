import { renderHook } from "@testing-library/react";
import {
  GroupWorkStatus,
  type PresenterGroupWorkGroups,
} from "../../../../../domain/workshopState";
import { usePresenterGroupWorkScreen } from "../usePresenterGroupWorkScreen";

function makeGroups(count: number): PresenterGroupWorkGroups {
  return Array.from({ length: count }, (_, index) => ({
    name: {
      animalId: `animal-${index}`,
      text: { de: `Tier ${index}`, en: `Animal ${index}` },
    },
    memberDisplayNames: ["Alice"],
    assignedValues: [],
    workStatus: GroupWorkStatus.Editing,
  }));
}

describe("usePresenterGroupWorkScreen", () => {
  it("returns all groups as the current page when fewer than seven", () => {
    const groups = makeGroups(3);
    const { result } = renderHook(() => usePresenterGroupWorkScreen(groups));

    expect(result.current.currentPageGroups).toHaveLength(3);
  });

  it("returns only six groups per page when there are more", () => {
    const groups = makeGroups(9);
    const { result } = renderHook(() => usePresenterGroupWorkScreen(groups));

    expect(result.current.currentPageGroups).toHaveLength(6);
  });

  it("returns an empty page when groups is empty", () => {
    const { result } = renderHook(() => usePresenterGroupWorkScreen([]));

    expect(result.current.currentPageGroups).toHaveLength(0);
  });
});
