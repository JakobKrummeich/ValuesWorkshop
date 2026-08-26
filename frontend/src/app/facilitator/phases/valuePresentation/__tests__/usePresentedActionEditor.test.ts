import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { usePresentedActionEditor } from "../usePresentedActionEditor";

const action = { actionId: "action-1", text: "We start meetings on time" };

function keyEvent(key: string): KeyboardEvent<HTMLInputElement> {
  return { key } as KeyboardEvent<HTMLInputElement>;
}

describe("usePresentedActionEditor", () => {
  it("starts the draft from the presented text", () => {
    const { result } = renderHook(() =>
      usePresentedActionEditor(action, jest.fn()),
    );

    expect(result.current.draft).toBe("We start meetings on time");
  });

  it("commits a changed trimmed draft on blur", () => {
    const onCorrect = jest.fn();
    const { result } = renderHook(() =>
      usePresentedActionEditor(action, onCorrect),
    );

    act(() => result.current.editDraft("  We start meetings early  "));
    act(() => result.current.handleBlur());

    expect(onCorrect).toHaveBeenCalledWith(
      "action-1",
      "We start meetings early",
    );
  });

  it("commits on Enter", () => {
    const onCorrect = jest.fn();
    const { result } = renderHook(() =>
      usePresentedActionEditor(action, onCorrect),
    );

    act(() => result.current.editDraft("We listen first"));
    act(() => result.current.handleKeyDown(keyEvent("Enter")));

    expect(onCorrect).toHaveBeenCalledWith("action-1", "We listen first");
  });

  it("sends nothing when the text is unchanged", () => {
    const onCorrect = jest.fn();
    const { result } = renderHook(() =>
      usePresentedActionEditor(action, onCorrect),
    );

    act(() => result.current.handleBlur());

    expect(onCorrect).not.toHaveBeenCalled();
  });

  it("restores the presented text instead of committing an empty draft", () => {
    const onCorrect = jest.fn();
    const { result } = renderHook(() =>
      usePresentedActionEditor(action, onCorrect),
    );

    act(() => result.current.editDraft("   "));
    act(() => result.current.handleBlur());

    expect(onCorrect).not.toHaveBeenCalled();
    expect(result.current.draft).toBe("We start meetings on time");
  });

  it("abandons the draft on Escape", () => {
    const onCorrect = jest.fn();
    const { result } = renderHook(() =>
      usePresentedActionEditor(action, onCorrect),
    );

    act(() => result.current.editDraft("half-typed"));
    act(() => result.current.handleKeyDown(keyEvent("Escape")));

    expect(result.current.draft).toBe("We start meetings on time");
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
