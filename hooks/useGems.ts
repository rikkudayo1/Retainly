"use client";

import { useEffect, useState, useRef } from "react";
import { getProfile, addGemsDB, spendGemsDB } from "@/lib/db";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const useGems = () => {
  const [gems, setGems] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const profile = await getProfile();
      if (profile) setGems(profile.gems);

      // Remove any existing channel with this name first
      const channelName = `gems-${user.id}`;
      await supabase.removeChannel(supabase.channel(channelName));

      channelRef.current = supabase
        .channel(channelName, {
          config: { broadcast: { ack: true } }, // force unique instance
        })
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as { gems: number };
            setGems(updated.gems);
          }
        )
        .subscribe((status) => {
          console.log("gems channel status:", status);
        });
    };

    init();

    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const addGems = async (amount: number) => await addGemsDB(amount);
  const spendGems = async (amount: number): Promise<boolean> => await spendGemsDB(amount);

  return { gems, addGems, spendGems };
};