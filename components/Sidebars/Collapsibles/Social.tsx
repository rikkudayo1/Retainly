"use client";

import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowRight, ChevronRight, Users, Swords, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { getPendingFriendRequestCount, getIncomingChallengeCount } from "@/lib/db";

const hoverStyle = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
  const el = e.currentTarget as HTMLElement;
  el.style.backgroundColor = enter ? `rgb(var(--theme-glow) / 0.08)` : "transparent";
  el.style.color = enter ? `var(--theme-badge-text)` : "";
};

const Badge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <span
      className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-mono text-[10px] font-bold flex items-center justify-center"
      style={{ backgroundColor: "var(--theme-primary)", color: "#fff" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

const Social = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [friendRequests, setFriendRequests] = React.useState(0);
  const [challenges, setChallenges] = React.useState(0);

  React.useEffect(() => {
    const fetch = async () => {
      const [f, c] = await Promise.all([
        getPendingFriendRequestCount(),
        getIncomingChallengeCount(),
      ]);
      setFriendRequests(f);
      setChallenges(c);
    };
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalBadge = friendRequests + challenges;

  const items = [
    { href: "/friends",    icon: <Users size={16} />,      label: "Friends",    badge: friendRequests },
    { href: "/challenges", icon: <Swords size={16} />,     label: "Challenges", badge: challenges },
    { href: "/groups",     icon: <UsersRound size={16} />, label: "Groups",     badge: 0 },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className="flex justify-between items-center p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          onMouseEnter={(e) => hoverStyle(e, true)}
          onMouseLeave={(e) => hoverStyle(e, false)}
        >
          <div className="flex items-center gap-2.5">
            <UserPlus size={16} />
            <span>Social</span>
            {!isOpen && totalBadge > 0 && <Badge count={totalBadge} />}
          </div>
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div
          className="ml-3 mt-1 mb-1 pl-3 space-y-0.5 border-l"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all"
              onMouseEnter={(e) => hoverStyle(e, true)}
              onMouseLeave={(e) => hoverStyle(e, false)}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge > 0
                ? <Badge count={item.badge} />
                : <ArrowRight size={12} className="opacity-40 shrink-0" />
              }
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default Social;