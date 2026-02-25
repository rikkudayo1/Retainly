"use client";

import { useEffect, useState } from "react";
import { getProfile, addGemsDB, spendGemsDB } from "@/lib/db";

export const useGems = () => {
  const [gems, setGems] = useState(0);

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile) setGems(profile.gems);
    });
  }, []);

  const addGems = async (amount: number) => {
    await addGemsDB(amount);
    setGems((prev) => prev + amount);
  };

  const spendGems = async (amount: number): Promise<boolean> => {
    const success = await spendGemsDB(amount);
    if (success) setGems((prev) => prev - amount);
    return success;
  };

  return { gems, addGems, spendGems };
};