"use client";

import { createContext, useContext, type ReactNode } from "react";

const ActionBarSlotContext = createContext<HTMLElement | null>(null);

export function ActionBarSlotProvider({
  slot,
  children,
}: {
  slot: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <ActionBarSlotContext.Provider value={slot}>
      {children}
    </ActionBarSlotContext.Provider>
  );
}

export function useActionBarSlot(): HTMLElement | null {
  return useContext(ActionBarSlotContext);
}
