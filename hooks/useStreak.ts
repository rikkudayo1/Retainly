"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { addGemsDB } from "@/lib/db";
import { postFeedEventToMyGroups } from "@/lib/db/groups";

const DAILY_REWARD = 30;

export const useStreak = () => {
  const [streak, setStreak] = useState(0);
  const [streakDay, setStreakDay] = useState(0);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("streak, streak_day, last_seen, last_reward")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      let newStreak = profile.streak ?? 0;
      let newStreakDay = profile.streak_day ?? 0;
      let shouldShowStreak = false;
      let shouldShowReward = false;
      let streakBroke = false;

      // ── Streak calculation ──────────────────────────────────
      if (profile.last_seen === today) {
        newStreak = profile.streak;
        newStreakDay = profile.streak_day;
      } else if (profile.last_seen === yesterday) {
        newStreak = profile.streak + 1;
        shouldShowStreak = true;
      } else {
        // Streak broke — only fire feed event if they had a streak worth mentioning
        if ((profile.streak ?? 0) >= 3) {
          streakBroke = true;
        }
        newStreak = 1;
        newStreakDay = 0;
        shouldShowStreak = true;
      }

      // ── Daily reward check ──────────────────────────────────
      if (profile.last_reward !== today) {
        shouldShowReward = true;
      }

      // ── Update Supabase ─────────────────────────────────────
      const updates: Record<string, any> = { last_seen: today };
      if (profile.last_seen !== today) {
        updates.streak = newStreak;
        updates.streak_day = newStreakDay;
      }

      await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id);

      setStreak(newStreak);
      setStreakDay(newStreakDay);

      // ── Feed events (fire-and-forget) ───────────────────────
      if (profile.last_seen !== today) {
        if (streakBroke) {
          postFeedEventToMyGroups("streak_broke", {
            streak: profile.streak,
          });
        } else if (shouldShowStreak && newStreak > 1) {
          postFeedEventToMyGroups("streak_extended", {
            streak: newStreak,
          });
        }
      }

      if (shouldShowStreak) {
        setShowStreakPopup(true);
        if (shouldShowReward) {
          sessionStorage.setItem("retainly_pending_reward", "1");
        }
      } else if (shouldShowReward) {
        setShowRewardPopup(true);
      }

      setChecked(true);
    };

    run();
  }, []);

  const dismissStreak = () => {
    setShowStreakPopup(false);
    const pending = sessionStorage.getItem("retainly_pending_reward");
    if (pending) {
      sessionStorage.removeItem("retainly_pending_reward");
      setShowRewardPopup(true);
    }
  };

  const claimReward = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const nextStreakDay = (streakDay + 1) % 7;

    await Promise.all([
      addGemsDB(DAILY_REWARD),
      supabase
        .from("user_profiles")
        .update({ last_reward: today, streak_day: nextStreakDay })
        .eq("id", user.id),
    ]);

    setStreakDay(nextStreakDay);
    setShowRewardPopup(false);
  };

  return {
    streak,
    streakDay,
    showStreakPopup,
    showRewardPopup,
    dismissStreak,
    claimReward,
    checked,
  };
};