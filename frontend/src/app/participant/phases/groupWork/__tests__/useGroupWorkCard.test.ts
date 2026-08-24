import { renderHook, act } from "@testing-library/react";
import { NEVER, of } from "rxjs";
import type { IntentResult } from "../../../../../domain/intentResult";
import {
  GroupWorkStatus,
  type OwnGroupView,
} from "../../../../../domain/workshopState";
import type { Single } from "../../../../../shared/reactiveTypes";
import { useParticipantDependencies } from "../../../dependencies";
import { useGroupWorkCard } from "../useGroupWorkCard";

jest.mock("../../../dependencies", () => ({
  useParticipantDependencies: jest.fn(),
}));

const dependencies = useParticipantDependencies as jest.MockedFunction<
  typeof useParticipantDependencies
>;

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

function mockGroupWorkPort(
  overrides: Partial<ReturnType<typeof makeGroupWorkPort>> = {},
) {
  const port = { ...makeGroupWorkPort(), ...overrides };
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    quizPort: { chooseAnswer: () => NEVER },
    selectionPort: { submitSelection: () => NEVER },
    groupWorkPort: port,
  });
  return port;
}

function makeGroupWorkPort() {
  return {
    addAction: jest.fn((): Single<IntentResult> => of(accepted)),
    editAction: jest.fn((): Single<IntentResult> => of(accepted)),
    removeAction: jest.fn((): Single<IntentResult> => of(accepted)),
    submitGroupWork: jest.fn((): Single<IntentResult> => of(accepted)),
    reopenGroupWork: jest.fn((): Single<IntentResult> => of(accepted)),
  };
}

function ownGroup(overrides: Partial<OwnGroupView> = {}): OwnGroupView {
  return {
    name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
    memberDisplayNames: ["Alice", "Bob"],
    assignedValues: [
      { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
      { valueId: "courage", text: { de: "Mut", en: "Courage" } },
    ],
    isCallerScribe: true,
    scribeName: "Alice",
    workStatus: GroupWorkStatus.Editing,
    actions: [],
    ...overrides,
  };
}

describe("useGroupWorkCard", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: () => "test-uuid" },
      configurable: true,
    });
  });

  it("selects the first value tab by default", () => {
    mockGroupWorkPort();
    const { result } = renderHook(() => useGroupWorkCard(ownGroup()));
    expect(result.current.selectedValueId).toBe("trust");
  });

  it("switches the selected value tab", () => {
    mockGroupWorkPort();
    const { result } = renderHook(() => useGroupWorkCard(ownGroup()));

    act(() => result.current.selectValue("courage"));

    expect(result.current.selectedValueId).toBe("courage");
  });

  it("filters actions for the selected value", () => {
    mockGroupWorkPort();
    const group = ownGroup({
      actions: [
        { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        { actionId: "a2", valueId: "courage", text: "Dare", sortOrder: 0 },
        { actionId: "a3", valueId: "trust", text: "Listen", sortOrder: 1 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    expect(result.current.actionsForSelectedValue).toHaveLength(2);
    expect(result.current.actionsForSelectedValue[0].actionId).toBe("a1");
    expect(result.current.actionsForSelectedValue[1].actionId).toBe("a3");
  });

  it("sends addAction intent through the port", () => {
    const port = mockGroupWorkPort();
    const { result } = renderHook(() => useGroupWorkCard(ownGroup()));

    act(() => result.current.addAction());

    expect(port.addAction).toHaveBeenCalledWith("test-uuid", "trust", "");
  });

  it("sends editAction with throttled text snapshots", () => {
    const port = mockGroupWorkPort();
    const group = ownGroup({
      actions: [{ actionId: "a1", valueId: "trust", text: "", sortOrder: 0 }],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    act(() => result.current.editActionText("a1", "Tal"));

    expect(port.editAction).toHaveBeenCalledWith("a1", "Tal");
    expect(result.current.localTexts["a1"]).toBe("Tal");
  });

  it("sends removeAction intent", () => {
    const port = mockGroupWorkPort();
    const group = ownGroup({
      actions: [
        { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    act(() => result.current.removeAction("a1"));

    expect(port.removeAction).toHaveBeenCalledWith("a1");
  });

  it("disables submit when a value has no actions", () => {
    mockGroupWorkPort();
    const group = ownGroup({
      actions: [
        { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    expect(result.current.canSubmit).toBe(false);
  });

  it("enables submit when every value has a non-empty action", () => {
    mockGroupWorkPort();
    const group = ownGroup({
      actions: [
        { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        { actionId: "a2", valueId: "courage", text: "Dare", sortOrder: 0 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    expect(result.current.canSubmit).toBe(true);
  });

  it("sends submitGroupWork intent", () => {
    const port = mockGroupWorkPort();
    const group = ownGroup({
      actions: [
        { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        { actionId: "a2", valueId: "courage", text: "Dare", sortOrder: 0 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    act(() => result.current.submitGroupWork());

    expect(port.submitGroupWork).toHaveBeenCalled();
  });

  it("sends reopenGroupWork intent when submitted", () => {
    const port = mockGroupWorkPort();
    const group = ownGroup({
      workStatus: GroupWorkStatus.Submitted,
      actions: [
        { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
        { actionId: "a2", valueId: "courage", text: "Dare", sortOrder: 0 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    act(() => result.current.reopenGroupWork());

    expect(port.reopenGroupWork).toHaveBeenCalled();
  });

  it("shows read-only state for non-scribe members", () => {
    mockGroupWorkPort();
    const group = ownGroup({ isCallerScribe: false });
    const { result } = renderHook(() => useGroupWorkCard(group));

    expect(result.current.isCallerScribe).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  it("prevents submit when actions have only empty text", () => {
    mockGroupWorkPort();
    const group = ownGroup({
      actions: [
        { actionId: "a1", valueId: "trust", text: "", sortOrder: 0 },
        { actionId: "a2", valueId: "courage", text: "Dare", sortOrder: 0 },
      ],
    });
    const { result } = renderHook(() => useGroupWorkCard(group));

    expect(result.current.canSubmit).toBe(false);
  });
});
