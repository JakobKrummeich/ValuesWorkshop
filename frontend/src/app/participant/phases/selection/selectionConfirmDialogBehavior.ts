import type { KeyboardEvent } from "react";

export interface SelectionConfirmDialogBehavior {
  trapKeyboardFocus: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function selectionConfirmDialogBehaviorOf(
  onCancel: () => void,
): SelectionConfirmDialogBehavior {
  return {
    trapKeyboardFocus: (event) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Tab") {
        cycleTabFocus(event);
      }
    },
  };
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
