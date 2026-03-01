// context/GemsContext.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useGems } from "@/hooks/useGems";

type GemsContextType = ReturnType<typeof useGems>;

const GemsContext = createContext<GemsContextType | null>(null);

export const GemsProvider = ({ children }: { children: ReactNode }) => {
  const gems = useGems();
  return <GemsContext.Provider value={gems}>{children}</GemsContext.Provider>;
};

export const useGemsContext = () => {
  const ctx = useContext(GemsContext);
  if (!ctx) throw new Error("useGemsContext must be used within GemsProvider");
  return ctx;
};