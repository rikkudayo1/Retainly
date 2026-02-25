"use client";

import { useEffect, useState } from "react";
import { useStreak } from "@/hooks/useStreak";
import { getProfile } from "@/lib/db";
import StreakPopup from "@/components/StreakPopup";
import RewardPopup from "@/components/RewardPopup";
import UsernamePrompt from "@/components/UsernamePrompt";

const AppPopupProvider = () => {
  const {
    streak,
    streakDay,
    showStreakPopup,
    showRewardPopup,
    dismissStreak,
    claimReward,
    checked,
  } = useStreak();

  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);

  // Check username after streak/reward flow is done
  useEffect(() => {
    if (!checked) return;
    if (showStreakPopup || showRewardPopup) return;
    if (usernameChecked) return;

    const check = async () => {
      const profile = await getProfile();
      if (profile && !profile.username) {
        setShowUsernamePrompt(true);
      }
      setUsernameChecked(true);
    };

    check();
  }, [checked, showStreakPopup, showRewardPopup, usernameChecked]);

  return (
    <>
      {showStreakPopup && (
        <StreakPopup streak={streak} onDismiss={dismissStreak} />
      )}
      {showRewardPopup && (
        <RewardPopup streakDay={streakDay} onClaim={claimReward} />
      )}
      {showUsernamePrompt && !showStreakPopup && !showRewardPopup && (
        <UsernamePrompt onComplete={() => setShowUsernamePrompt(false)} />
      )}
    </>
  );
};

export default AppPopupProvider;