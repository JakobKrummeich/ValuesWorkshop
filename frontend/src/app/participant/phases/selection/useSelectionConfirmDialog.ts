"use client";

import type { KeyboardEvent } from "react";

export interface SelectionConfirmDialogBehavior {
  focusOnMount: (button: HTMLButtonElement | null) => void;
  trapKeyboardFocus: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function useSelectionConfirmDialog(
  onCancel: () => void,
): SelectionConfirmDialogBehavior {
  return {
    focusOnMount,
    trapKeyboardFocus: (event) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Tab") {
        cycleTabFocus(event);
      }
    },
  };
}

function focusOnMount(button: HTMLButtonElement | null) {
  button?.focus();
}

function cycleTabFocus(event: KeyboardEvent<HTMLDivElement>) {
  const buttons = event.currentTarget.querySelectorAll("button");
  const first = buttons[0];
  const last = buttons[buttons.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
