import { useEffect, useState } from "react";

const GEMS_KEY = "retainly_gems";

export const useGems = () => {
  const [gems, setGems] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(GEMS_KEY);
    if (saved) setGems(parseInt(saved));
  }, []);

  const addGems = (amount: number) => {
    setGems((prev) => {
      const next = prev + amount;
      localStorage.setItem(GEMS_KEY, String(next));
      return next;
    });
  };

  const spendGems = (amount: number): boolean => {
    const current = parseInt(localStorage.getItem(GEMS_KEY) || "0");
    if (current < amount) return false;
    const next = current - amount;
    localStorage.setItem(GEMS_KEY, String(next));
    setGems(next);
    return true;
  };

  return { gems, addGems, spendGems };
};