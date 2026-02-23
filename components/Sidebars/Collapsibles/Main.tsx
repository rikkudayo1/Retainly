"use client";

import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowRight, ChevronRight, Text, CircleHelp, UploadCloud, BookOpen } from "lucide-react";
import Link from "next/link";

const hoverStyle = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
  const el = e.currentTarget as HTMLElement;
  el.style.backgroundColor = enter ? `rgb(var(--theme-glow) / 0.08)` : "transparent";
  el.style.color = enter ? `var(--theme-badge-text)` : "";
};

const items = [
  { href: "/upload", icon: <UploadCloud size={16} />, label: "Upload" },
  { href: "/summary", icon: <Text size={16} />, label: "Summary" },
  { href: "/quizzes", icon: <CircleHelp size={16} />, label: "Quizzes" },
];

const Main = () => {
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
            <BookOpen size={16} />
            <span>Main</span>
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

export default Main;