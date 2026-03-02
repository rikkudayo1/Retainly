"use client";

import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowRight, ChevronRight, PlusCircle, BadgeQuestionMark, Upload, Search } from "lucide-react";
import Link from "next/link";

const hoverStyle = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
  const el = e.currentTarget as HTMLElement;
  el.style.backgroundColor = enter ? `rgb(var(--theme-glow) / 0.08)` : "transparent";
  el.style.color = enter ? `var(--theme-badge-text)` : "";
};

const items = [
  { href: "/quizzes/generate", icon: <PlusCircle size={16} />, label: "Create" },
  { href: "/quizzes", icon: <BadgeQuestionMark size={16} />, label: "Your Quizzes" },
  { href: "/quizzes/browse", icon: <Search size={16} />, label: "Public Quizzes" },
  { href: "/quizzes/publish", icon: <Upload size={16} />, label: "Publish" },
];

const Quiz = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className="flex justify-between items-center p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          onMouseEnter={(e) => hoverStyle(e, true)}
          onMouseLeave={(e) => hoverStyle(e, false)}
        >
          <div className="flex items-center gap-2.5">
            <BadgeQuestionMark size={16} />
            <span>Quizzes</span>
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
              className="flex justify-between items-center p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all"
              onMouseEnter={(e) => hoverStyle(e, true)}
              onMouseLeave={(e) => hoverStyle(e, false)}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <ArrowRight size={12} className="opacity-40" />
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default Quiz;