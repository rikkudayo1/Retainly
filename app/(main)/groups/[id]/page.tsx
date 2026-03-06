"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getGroup, getGroupFeed, getGroupLeaderboard, getGroupLibrary,
  getGroupAssignments, getGroupMembers, contributeToLibrary,
  createAssignment, deleteAssignment, removeFromLibrary, kickMember,
  updateMemberRole, leaveGroup, deleteGroup, regenerateJoinCode,
  Group, FeedEvent, GroupLeaderboardEntry, LibraryItem,
  GroupAssignment, GroupMember, COVER_STYLES, GroupCover, GROUP_COVERS,
} from "@/lib/db";
import { getDecks, getMyQuizCollection } from "@/lib/db";
import {
  Terminal, Users, Swords, BookOpen, LayoutList,
  Loader2, Hash, Copy, RefreshCw, Flame, Zap, Plus,
  X, ArrowRight, Trash2, Shield, UserX, LogOut,
  Clock, Camera, Pencil, Check, ChevronDown,
  Calendar, ChevronLeft, ChevronRight,
} from "lucide-react";
import { ImageCropModal } from "@/components/ImageCropModal";
import { createClient } from "@/lib/supabase";

// ── Helpers ────────────────────────────────────────────────────
const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const timeLeft = (due: string | null) => {
  if (!due) return null;
  const diff = new Date(due).getTime() - Date.now();
  if (diff <= 0) return "overdue";
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
};

const Avatar = ({ username, avatar, size = 8 }: { username: string; avatar?: string | null; size?: number }) => (
  <div
    className={`rounded-xl overflow-hidden shrink-0`}
    style={{
      width: size * 4,
      height: size * 4,
      minWidth: size * 4,
      backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
    }}
  >
    {avatar
      ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
      : <div className="w-full h-full flex items-center justify-center font-black text-xs"
          style={{ color: "var(--theme-primary)" }}>
          {username?.[0]?.toUpperCase() ?? "?"}
        </div>
    }
  </div>
);

// ── Feed event renderer ────────────────────────────────────────
const FeedEventRow = ({ event }: { event: FeedEvent }) => {
  const icons: Record<string, string> = {
    quiz_score: "⚡", streak_extended: "🔥", streak_broke: "💀",
    library_add: "📚", assignment_complete: "✅", personal_best: "🏆",
  };
  const renderText = () => {
    const p = event.payload;
    switch (event.type) {
      case "quiz_score": return <><span className="font-bold">@{event.username}</span> scored <span style={{ color: "var(--theme-primary)" }}>{p.percent ?? Math.round((p.score / p.question_count) * 100)}%</span> on <span className="italic">{p.quiz_title}</span></>;
      case "streak_extended": return <><span className="font-bold">@{event.username}</span> extended their streak to <span style={{ color: "#f97316" }}>{p.streak} days 🔥</span></>;
      case "streak_broke": return <><span className="font-bold">@{event.username}</span>'s streak broke after <span style={{ color: "#ef4444" }}>{p.streak} days</span></>;
      case "library_add": return <><span className="font-bold">@{event.username}</span> added <span className="italic">{p.title}</span> to the library</>;
      case "assignment_complete": return <><span className="font-bold">@{event.username}</span> completed the assignment with <span style={{ color: "var(--theme-primary)" }}>{p.percent}%</span></>;
      case "personal_best": return <><span className="font-bold">@{event.username}</span> hit a new personal best: <span style={{ color: "var(--theme-primary)" }}>{p.percent}%</span></>;
      default: return <><span className="font-bold">@{event.username}</span> did something</>;
    }
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: `rgb(var(--theme-glow) / 0.07)` }}>
      <Avatar username={event.username ?? "?"} avatar={event.avatar_url} size={8} />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{renderText()}</p>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
          {icons[event.type]} {timeAgo(event.created_at)}
        </p>
      </div>
    </div>
  );
};

// ── Custom Date/Time Picker ────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const DateTimePicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const now = new Date();

  // Parse current value or default to now+1day
  const parsed = value ? new Date(value) : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());
  const [selDate, setSelDate] = useState<Date | null>(parsed);
  const [hour, setHour] = useState(parsed?.getHours() ?? 23);
  const [minute, setMinute] = useState(parsed?.getMinutes() ?? 59);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropHeight = 360;
      setDropPos({
        top: spaceBelow > dropHeight ? rect.bottom + 6 : rect.top - dropHeight - 6,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(o => !o);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day, hour, minute);
    setSelDate(d);
    // Emit ISO string in local time
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`);
  };

  const updateTime = (h: number, m: number) => {
    setHour(h); setMinute(m);
    if (selDate) {
      const d = new Date(selDate);
      d.setHours(h, m);
      const pad = (n: number) => String(n).padStart(2, "0");
      onChange(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`);
    }
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const displayVal = selDate
    ? `${MONTHS[selDate.getMonth()].slice(0,3)} ${selDate.getDate()}, ${selDate.getFullYear()}  ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`
    : null;

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && viewMonth === t.getMonth() && viewYear === t.getFullYear();
  };
  const isSelected = (day: number) => selDate && day === selDate.getDate() && viewMonth === selDate.getMonth() && viewYear === selDate.getFullYear();

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border font-mono text-sm transition-all text-left"
        style={{
          borderColor: open ? `rgb(var(--theme-glow) / 0.5)` : `rgb(var(--theme-glow) / 0.15)`,
          backgroundColor: open ? `rgb(var(--theme-glow) / 0.05)` : "transparent",
          color: displayVal ? "var(--foreground)" : `rgb(var(--theme-glow) / 0.35)`,
          boxShadow: open ? `0 0 0 2px rgb(var(--theme-glow) / 0.08)` : "none",
        }}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
          <span>{displayVal ?? "no due date"}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-2 transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: `rgb(var(--theme-glow) / 0.4)` }} />
      </button>

      {open && (
        <div
          className="rounded-xl border z-[9999] overflow-hidden"
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            backgroundColor: "var(--background)",
            borderColor: `rgb(var(--theme-glow) / 0.18)`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
            <button onClick={prevMonth} className="p-1 rounded-lg opacity-40 hover:opacity-80 transition-opacity"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span className="font-mono text-xs font-bold" style={{ color: "var(--theme-badge-text)" }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="p-1 rounded-lg opacity-40 hover:opacity-80 transition-opacity"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>

          {/* Calendar grid */}
          <div className="px-3 py-2">
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center font-mono text-[9px] py-1" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <button
                    key={day}
                    onClick={() => selectDay(day)}
                    className="aspect-square w-full flex items-center justify-center rounded-lg font-mono text-xs transition-all"
                    style={{
                      backgroundColor: sel ? "var(--theme-primary)" : tod ? `rgb(var(--theme-glow) / 0.1)` : "transparent",
                      color: sel ? "#fff" : tod ? "var(--theme-badge-text)" : "var(--foreground)",
                      fontWeight: sel || tod ? "700" : "400",
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = tod ? `rgb(var(--theme-glow) / 0.1)` : "transparent"; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="px-4 py-3 border-t flex items-center gap-3" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
            <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>time</span>
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Hour */}
              <div className="flex flex-col items-center">
                <button onClick={() => updateTime((hour + 1) % 24, minute)} className="px-1.5 py-0.5 rounded opacity-40 hover:opacity-80 font-mono text-xs">▲</button>
                <span className="font-mono text-sm font-bold w-7 text-center" style={{ color: "var(--theme-badge-text)" }}>{String(hour).padStart(2,"0")}</span>
                <button onClick={() => updateTime((hour - 1 + 24) % 24, minute)} className="px-1.5 py-0.5 rounded opacity-40 hover:opacity-80 font-mono text-xs">▼</button>
              </div>
              <span className="font-mono text-sm font-bold opacity-40">:</span>
              {/* Minute */}
              <div className="flex flex-col items-center">
                <button onClick={() => updateTime(hour, (minute + 5) % 60)} className="px-1.5 py-0.5 rounded opacity-40 hover:opacity-80 font-mono text-xs">▲</button>
                <span className="font-mono text-sm font-bold w-7 text-center" style={{ color: "var(--theme-badge-text)" }}>{String(minute).padStart(2,"0")}</span>
                <button onClick={() => updateTime(hour, (minute - 5 + 60) % 60)} className="px-1.5 py-0.5 rounded opacity-40 hover:opacity-80 font-mono text-xs">▼</button>
              </div>
            </div>
          </div>

          {/* Clear / Done */}
          <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
            <button onClick={() => { setSelDate(null); onChange(""); }} className="font-mono text-[10px] opacity-40 hover:opacity-70 transition-opacity">clear</button>
            <button onClick={() => setOpen(false)} className="font-mono text-[10px] px-3 py-1.5 rounded-lg transition-all" style={{ background: "var(--theme-primary)", color: "#fff" }}>done</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Reusable custom dropdown ───────────────────────────────────
const CustomSelect = ({
  items, selectedId, onSelect, placeholder, loading, emptyText,
}: {
  items: { id: string; title: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  loading?: boolean;
  emptyText?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = items.find(i => i.id === selectedId);

  if (loading) return (
    <div className="flex items-center gap-2 font-mono text-xs px-3 py-2.5 rounded-xl border" style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, color: `rgb(var(--theme-glow) / 0.4)` }}>
      <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--theme-primary)" }} /> loading...
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border font-mono text-sm transition-all text-left"
        style={{
          borderColor: open ? `rgb(var(--theme-glow) / 0.5)` : `rgb(var(--theme-glow) / 0.15)`,
          backgroundColor: open ? `rgb(var(--theme-glow) / 0.05)` : "transparent",
          color: selected ? "var(--foreground)" : `rgb(var(--theme-glow) / 0.35)`,
          boxShadow: open ? `0 0 0 2px rgb(var(--theme-glow) / 0.08)` : "none",
        }}
      >
        <span className="truncate">{selected ? selected.title : placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-2 transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: `rgb(var(--theme-glow) / 0.4)` }} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-xl border overflow-hidden z-[200]"
          style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.18)`, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          {items.length === 0 ? (
            <div className="px-3 py-3 font-mono text-xs text-center" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
              {emptyText ?? "// no items found"}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {items.map((item, idx) => {
                const isSel = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onSelect(item.id); setOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left font-mono text-sm transition-all"
                    style={{
                      backgroundColor: isSel ? `rgb(var(--theme-glow) / 0.1)` : "transparent",
                      color: isSel ? "var(--theme-badge-text)" : "var(--foreground)",
                      borderTop: idx > 0 ? `1px solid rgb(var(--theme-glow) / 0.06)` : "none",
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = `rgb(var(--theme-glow) / 0.05)`; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <span className="truncate">{item.title}</span>
                    {isSel && <Check className="w-3 h-3 shrink-0 ml-2" style={{ color: "var(--theme-primary)" }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Assign quiz modal ──────────────────────────────────────────
const AssignModal = ({ groupId, onClose, onAssigned }: { groupId: string; onClose: () => void; onAssigned: () => void }) => {
  const [quizzes, setQuizzes] = useState<{ id: string; title: string }[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    getMyQuizCollection().then((data) => {
      setQuizzes(data.map((q) => ({ id: q.id, title: q.title })));
      setLoadingQuizzes(false);
    });
  }, []);

  const handleAssign = async () => {
    if (!selectedQuizId) return;
    setLoading(true);
    await createAssignment({ groupId, quizId: selectedQuizId, dueAt: dueAt ? new Date(dueAt).toISOString() : null });
    setLoading(false);
    onAssigned();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border overflow-hidden" style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: "var(--background)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
          <span className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>// assign_quiz</span>
          <button onClick={onClose} className="opacity-40 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] block mb-1.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// quiz</label>
            <CustomSelect
              items={quizzes}
              selectedId={selectedQuizId}
              onSelect={setSelectedQuizId}
              placeholder="select a quiz..."
              loading={loadingQuizzes}
              emptyText="// no quizzes found"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] block mb-1.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// due_date (optional)</label>
            <DateTimePicker value={dueAt} onChange={setDueAt} />
          </div>
          <button onClick={handleAssign} disabled={!selectedQuizId || loading} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: "var(--theme-primary)", color: "#fff", opacity: !selectedQuizId || loading ? 0.6 : 1 }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> assign</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Contribute modal ───────────────────────────────────────────
const ContributeModal = ({ groupId, onClose, onContributed }: { groupId: string; onClose: () => void; onContributed: () => void }) => {
  const [itemType, setItemType] = useState<"quiz" | "deck">("quiz");
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingItems(true);
      setSelectedId("");
      if (itemType === "quiz") {
        const data = await getMyQuizCollection();
        setItems(data.map((q) => ({ id: q.id, title: q.title })));
      } else {
        const data = await getDecks();
        setItems(data.map((d) => ({ id: d.id, title: d.title })));
      }
      setLoadingItems(false);
    };
    load();
  }, [itemType]);

  const handleContribute = async () => {
    if (!selectedId) return;
    setLoading(true);
    await contributeToLibrary({ groupId, itemType, itemId: selectedId });
    setLoading(false);
    onContributed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border" style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: "var(--background)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
          <span className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>// contribute</span>
          <button onClick={onClose} className="opacity-40 hover:opacity-70 transition-opacity"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}>
            {(["quiz", "deck"] as const).map((t) => (
              <button key={t} onClick={() => setItemType(t)} className="flex-1 py-1.5 rounded-md font-mono text-xs transition-all"
                style={{ backgroundColor: itemType === t ? `rgb(var(--theme-glow) / 0.12)` : "transparent", color: itemType === t ? "var(--theme-badge-text)" : `rgb(var(--theme-glow) / 0.4)` }}>
                {t}
              </button>
            ))}
          </div>

          {/* Custom dropdown */}
          <div>
            <label className="font-mono text-[10px] block mb-1.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// select_{itemType}</label>
            <CustomSelect
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              placeholder={`select a ${itemType}...`}
              loading={loadingItems}
              emptyText={itemType === "deck" ? "// no decks found" : "// no quizzes found"}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleContribute}
            disabled={!selectedId || loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: "var(--theme-primary)", color: "#fff", opacity: !selectedId || loading ? 0.5 : 1 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> contribute</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Cover dot picker ───────────────────────────────────────────
const CoverDot = ({ cover, selected, onClick }: { cover: GroupCover; selected: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="w-6 h-6 rounded-lg transition-all shrink-0" style={{ background: COVER_STYLES[cover].bg, outline: selected ? "2px solid white" : "2px solid transparent", outlineOffset: "2px", transform: selected ? "scale(1.15)" : "scale(1)" }} />
);

// ── Main page ──────────────────────────────────────────────────
type Tab = "feed" | "library" | "assignments" | "members";

const GroupDetailPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");

  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<GroupLeaderboardEntry[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showCodeCopied, setShowCodeCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ── Edit state ─────────────────────────────────────────────
  const [cropTarget, setCropTarget] = useState<{ file: File; type: "banner" | "icon" } | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Inline name/subject edit
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingSubject, setEditingSubject] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editingCover, setEditingCover] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      const g = await getGroup(groupId);
      if (!g) { router.push("/groups"); return; }
      setGroup(g);
      setEditName(g.name);
      setEditSubject(g.subject ?? "");
      setLoading(false);
      const [f, lb] = await Promise.all([getGroupFeed(groupId), getGroupLeaderboard(groupId)]);
      setFeed(f); setLeaderboard(lb);
    };
    load();
  }, [groupId, router]);

  const loadTab = useCallback(async (t: Tab) => {
    setTab(t); setTabLoading(true);
    if (t === "feed") { const [f, lb] = await Promise.all([getGroupFeed(groupId), getGroupLeaderboard(groupId)]); setFeed(f); setLeaderboard(lb); }
    else if (t === "library") setLibrary(await getGroupLibrary(groupId));
    else if (t === "assignments") setAssignments(await getGroupAssignments(groupId));
    else if (t === "members") setMembers(await getGroupMembers(groupId));
    setTabLoading(false);
  }, [groupId]);

  // Reload assignments silently when user returns to the page (e.g. after completing a quiz)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && tab === "assignments") {
        getGroupAssignments(groupId).then(setAssignments);
      }
    };
    const handleFocus = () => {
      if (tab === "assignments") {
        getGroupAssignments(groupId).then(setAssignments);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [tab, groupId]);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.join_code);
    setShowCodeCopied(true);
    setTimeout(() => setShowCodeCopied(false), 2000);
  };

  const handleRegenCode = async () => {
    if (!group) return;
    const { code } = await regenerateJoinCode(group.id);
    if (code) setGroup((g) => g ? { ...g, join_code: code } : g);
  };

  // ── Image upload helpers ───────────────────────────────────
  const uploadImage = async (blob: Blob, path: string): Promise<string | null> => {
    const supabase = createClient();
    const file = new File([blob], path.split("/").pop()!, { type: "image/webp" });
    const { error } = await supabase.storage.from("group-images").upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("group-images").getPublicUrl(path);
    return data.publicUrl + `?t=${Date.now()}`;
  };

  const handleCropDone = async (blob: Blob, type: "banner" | "icon") => {
    setCropTarget(null);
    if (!group) return;
    const previewUrl = URL.createObjectURL(blob);

    if (type === "banner") {
      setBannerPreview(previewUrl);
      setUploadingBanner(true);
      const url = await uploadImage(blob, `${group.id}/banner.webp`);
      if (url) {
        const supabase = createClient();
        await supabase.from("groups").update({ banner_url: url }).eq("id", group.id);
        setGroup((g) => g ? { ...g, banner_url: url } as any : g);
      }
      setUploadingBanner(false);
    } else {
      setIconPreview(previewUrl);
      setUploadingIcon(true);
      const url = await uploadImage(blob, `${group.id}/icon.webp`);
      if (url) {
        const supabase = createClient();
        await supabase.from("groups").update({ icon_url: url }).eq("id", group.id);
        setGroup((g) => g ? { ...g, icon_url: url } as any : g);
      }
      setUploadingIcon(false);
    }
  };

  // ── Save name / subject / cover ────────────────────────────
  const saveMeta = async (field: "name" | "subject" | "cover", value: string) => {
    if (!group) return;
    setSavingMeta(true);
    const supabase = createClient();
    await supabase.from("groups").update({ [field]: value }).eq("id", group.id);
    setGroup((g) => g ? { ...g, [field]: value } as any : g);
    setSavingMeta(false);
    if (field === "name") setEditingName(false);
    if (field === "subject") setEditingSubject(false);
    if (field === "cover") setEditingCover(false);
  };

  if (loading || !group) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--theme-primary)" }} />
    </div>
  );

  const style = COVER_STYLES[group.cover as GroupCover] ?? COVER_STYLES.purple;
  const isOwner = group.my_role === "owner";
  const canManage = group.my_role === "owner" || group.my_role === "admin";
  const bannerUrl = (group as any).banner_url as string | null;
  const iconUrl = (group as any).icon_url as string | null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "feed",        label: "feed",    icon: <Zap className="w-3 h-3" /> },
    { id: "library",     label: "library", icon: <BookOpen className="w-3 h-3" /> },
    { id: "assignments", label: "tasks",   icon: <LayoutList className="w-3 h-3" /> },
    { id: "members",     label: "members", icon: <Users className="w-3 h-3" /> },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .edit-btn { opacity: 1; transition: opacity 0.15s; }
      `}</style>

      {/* Hidden file inputs */}
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropTarget({ file: f, type: "banner" }); e.target.value = ""; }} />
      <input ref={iconInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropTarget({ file: f, type: "icon" }); e.target.value = ""; }} />

      {/* Crop modal */}
      {cropTarget && (
        <ImageCropModal
          file={cropTarget.file}
          aspectRatio={cropTarget.type === "banner" ? 16 / 5 : 1}
          shape={cropTarget.type === "icon" ? "circle" : "rect"}
          title={cropTarget.type === "banner" ? "crop_banner" : "crop_icon"}
          onCrop={(blob) => handleCropDone(blob, cropTarget.type)}
          onClose={() => setCropTarget(null)}
        />
      )}

      {showAssignModal && (
        <AssignModal groupId={group.id} onClose={() => setShowAssignModal(false)} onAssigned={() => { setShowAssignModal(false); loadTab("assignments"); }} />
      )}
      {showContributeModal && (
        <ContributeModal groupId={group.id} onClose={() => setShowContributeModal(false)} onContributed={() => { setShowContributeModal(false); loadTab("library"); }} />
      )}

      <div className="min-h-screen bg-background text-foreground pb-24">

        {/* ── Banner ──────────────────────────────────────────── */}
        <div className="relative edit-zone" style={{ height: "clamp(140px, 22vw, 260px)" }}>
          <div className="absolute inset-0 overflow-hidden">
            {bannerPreview || bannerUrl ? (
              <img src={bannerPreview ?? bannerUrl!} alt="banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: style.bg }}>
                <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 4px)" }} />
              </div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, var(--background) 100%)" }} />
          </div>

          <button
            onClick={() => router.push("/groups")}
            className="absolute top-4 left-4 font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all z-10 md:text-xs md:px-3 md:py-2"
            style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
          >
            ← groups
          </button>

          {canManage && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="edit-btn absolute top-4 right-4 flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1.5 rounded-lg z-10 md:text-xs md:px-3 md:py-2 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {uploadingBanner ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Camera className="w-3 h-3 md:w-4 md:h-4" /> edit banner</>}
            </button>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-5 md:px-8">

          {/* ── Group header ───────────────────────────────────── */}
          <div className="page-enter -mt-14 md:-mt-16 mb-8 relative z-10">
            <div className="flex items-end gap-4 md:gap-6">

              {/* Icon */}
              <div className="relative edit-zone shrink-0">
                <div
                  className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: iconPreview || iconUrl ? "transparent" : `rgb(${style.glow} / 0.2)`,
                    boxShadow: "0 0 0 4px var(--background)",
                  }}
                >
                  {iconPreview || iconUrl ? (
                    <img src={iconPreview ?? iconUrl!} alt="icon" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-3xl md:text-4xl" style={{ color: `rgb(${style.glow})` }}>
                      {group.name[0]?.toUpperCase()}
                    </span>
                  )}
                  {uploadingIcon && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {canManage && (
                  <button
                    onClick={() => iconInputRef.current?.click()}
                    className="edit-btn absolute -bottom-2 -right-2 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center z-10"
                    style={{ background: "var(--theme-primary)", color: "#fff", boxShadow: "0 0 0 3px var(--background)" }}
                  >
                    <Camera className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                )}
              </div>

              {/* Name + subject + cover */}
              <div className="flex-1 min-w-0 pb-1">

                {/* Name */}
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveMeta("name", editName); if (e.key === "Escape") setEditingName(false); }}
                      maxLength={40}
                      className="text-2xl md:text-3xl font-black bg-transparent border-b-2 outline-none flex-1 min-w-0"
                      style={{ borderColor: "var(--theme-primary)", color: "var(--foreground)" }}
                    />
                    <button onClick={() => saveMeta("name", editName)} disabled={savingMeta}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--theme-primary)", color: "#fff" }}>
                      {savingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setEditingName(false)} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-40 hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight truncate">{group.name}</h1>
                    {canManage && (
                      <button onClick={() => { setEditName(group.name); setEditingName(true); }} className="opacity-0 group-hover/name:opacity-40 hover:!opacity-80 transition-opacity shrink-0">
                        <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Subject */}
                {editingSubject ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="w-3 h-3 shrink-0" style={{ color: `rgb(${style.glow})` }} />
                    <input
                      autoFocus
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveMeta("subject", editSubject); if (e.key === "Escape") setEditingSubject(false); }}
                      placeholder="subject..."
                      maxLength={30}
                      className="font-mono text-xs md:text-sm bg-transparent border-b outline-none flex-1"
                      style={{ borderColor: `rgb(${style.glow} / 0.5)`, color: `rgb(${style.glow})` }}
                    />
                    <button onClick={() => saveMeta("subject", editSubject)} disabled={savingMeta}
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ background: "var(--theme-primary)", color: "#fff" }}>
                      {savingMeta ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                    </button>
                    <button onClick={() => setEditingSubject(false)} className="opacity-40 hover:opacity-70 shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1 group/subj">
                    {group.subject ? (
                      <>
                        <Hash className="w-3 h-3 shrink-0" style={{ color: `rgb(${style.glow})` }} />
                        <span className="font-mono text-xs md:text-sm truncate" style={{ color: `rgb(${style.glow})` }}>{group.subject}</span>
                      </>
                    ) : (
                      canManage && <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.25)` }}>+ add subject</span>
                    )}
                    {canManage && (
                      <button onClick={() => { setEditSubject(group.subject ?? ""); setEditingSubject(true); }} className="opacity-0 group-hover/subj:opacity-40 hover:!opacity-80 transition-opacity ml-1 shrink-0">
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Cover color picker */}
                {canManage && (
                  <div className="mt-2">
                    {editingCover ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 flex-wrap">
                          {GROUP_COVERS.map((c) => <CoverDot key={c} cover={c} selected={group.cover === c} onClick={() => saveMeta("cover", c)} />)}
                        </div>
                        <button onClick={() => setEditingCover(false)} className="opacity-40 hover:opacity-70 ml-1"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingCover(true)} className="flex items-center gap-1.5 font-mono text-[10px] md:text-xs opacity-40 hover:opacity-70 transition-opacity">
                        <div className="w-3 h-3 rounded" style={{ background: style.bg }} /> change color
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 font-mono text-[10px] md:text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_count}/20 members</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>·</span>
              <span className="capitalize">{group.my_role}</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>·</span>
              <div className="flex items-center gap-1.5">
                <span className="tracking-widest">{group.join_code}</span>
                <button onClick={copyCode} style={{ color: showCodeCopied ? "#22c55e" : undefined }}><Copy className="w-3 h-3" /></button>
                {isOwner && <button onClick={handleRegenCode} title="Regenerate"><RefreshCw className="w-3 h-3" /></button>}
              </div>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>·</span>
              {!isOwner ? (
                <button onClick={async () => { await leaveGroup(group.id); router.push("/groups"); }} className="flex items-center gap-1 hover:text-red-400 transition-colors">
                  <LogOut className="w-3 h-3" /> leave
                </button>
              ) : (
                <button onClick={async () => { await deleteGroup(group.id); router.push("/groups"); }} className="flex items-center gap-1 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" /> delete
                </button>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b mb-6 md:mb-8" style={{ borderColor: `rgb(var(--theme-glow) / 0.1)` }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => loadTab(t.id)}
                className="flex items-center gap-1.5 px-4 md:px-6 py-2.5 md:py-3 font-mono text-xs md:text-sm transition-all border-b-2"
                style={{ color: tab === t.id ? "var(--theme-badge-text)" : `rgb(var(--theme-glow) / 0.4)`, borderColor: tab === t.id ? "var(--theme-primary)" : "transparent", marginBottom: "-1px" }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {tabLoading ? (
            <div className="flex items-center gap-2 font-mono text-xs md:text-sm py-8 md:py-12" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--theme-primary)" }} /> loading...
            </div>
          ) : (
            <>
              {/* ══ FEED TAB ══ */}
              {tab === "feed" && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-4 mb-4 md:mb-5">
                      <span className="font-mono text-[10px] md:text-xs tracking-[0.2em] shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>// WEEKLY_LEADERBOARD</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
                    </div>
                    {leaderboard.length === 0 ? (
                      <p className="font-mono text-xs md:text-sm" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// no activity this week yet</p>
                    ) : (
                      <div className="space-y-2 md:space-y-2.5">
                        {leaderboard.map((entry, i) => (
                          <div key={entry.user_id} className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl border"
                            style={{ borderColor: i === 0 ? `rgb(${style.glow} / 0.3)` : `rgb(var(--theme-glow) / 0.1)`, backgroundColor: i === 0 ? `rgb(${style.glow} / 0.05)` : `rgb(var(--theme-glow) / 0.02)` }}>
                            <span className="font-mono text-xs w-5 shrink-0" style={{ color: i < 3 ? ["#fbbf24","#9ca3af","#b45309"][i] : `rgb(var(--theme-glow) / 0.3)` }}>
                              {i === 0 ? "👑" : `#${i + 1}`}
                            </span>
                            <Avatar username={entry.username} avatar={entry.avatar_url} size={8} />
                            <span className="flex-1 font-bold text-sm md:text-base truncate">{entry.username}</span>
                            {entry.role !== "member" && (
                              <span className="font-mono text-[9px] md:text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `rgb(${style.glow} / 0.12)`, color: `rgb(${style.glow})` }}>{entry.role}</span>
                            )}
                            <span className="font-mono text-xs md:text-sm font-bold shrink-0" style={{ color: "var(--theme-primary)" }}>{entry.points} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-4 md:mb-5">
                      <span className="font-mono text-[10px] md:text-xs tracking-[0.2em] shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>// ACTIVITY_FEED</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
                    </div>
                    {feed.length === 0 ? (
                      <p className="font-mono text-xs md:text-sm" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// no activity yet — study something!</p>
                    ) : (
                      <div>{feed.map((e) => <FeedEventRow key={e.id} event={e} />)}</div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ LIBRARY TAB ══ */}
              {tab === "library" && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>// SHARED_LIBRARY</span>
                    <button onClick={() => setShowContributeModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs" style={{ background: "var(--theme-primary)", color: "#fff" }}>
                      <Plus className="w-3 h-3" /> contribute
                    </button>
                  </div>
                  {library.length === 0 ? (
                    <div className="text-center py-10 font-mono"><BookOpen className="w-8 h-8 mx-auto mb-3 opacity-20" /><p className="text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// library is empty</p><p className="text-xs mt-1 text-muted-foreground">Be the first to contribute a quiz or deck.</p></div>
                  ) : (
                    <div className="space-y-2.5">
                      {library.map((item) => {
                        const hotThreshold = Math.floor((item.member_count ?? 2) * 0.5);
                        const isHot = item.study_count >= hotThreshold && item.study_count > 0;
                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `rgb(${style.glow} / 0.1)` }}>
                              {item.item_type === "quiz" ? <Zap className="w-4 h-4" style={{ color: `rgb(${style.glow})` }} /> : <BookOpen className="w-4 h-4" style={{ color: `rgb(${style.glow})` }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2"><p className="font-bold text-sm truncate">{item.title}</p>{isHot && <span className="shrink-0 text-[11px]">🔥</span>}</div>
                              <p className="font-mono text-[10px] mt-0.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>by @{item.contributor_username} · {item.study_count} studies</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => { if (item.item_type === "quiz") router.push(`/quizzes/study/${item.item_id}`); else router.push(`/decks/${item.item_id}`); }} className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all" style={{ background: `rgb(${style.glow} / 0.12)`, color: `rgb(${style.glow})` }}>study</button>
                              {(canManage || item.contributed_by === currentUserId) && (
                                <button onClick={async () => { await removeFromLibrary(item.id); setLibrary((p) => p.filter((i) => i.id !== item.id)); }} className="p-1.5 rounded-lg opacity-40 hover:opacity-70 transition-opacity"><X className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ ASSIGNMENTS TAB ══ */}
              {tab === "assignments" && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>// ASSIGNMENTS</span>
                    {canManage && (
                      <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs" style={{ background: "var(--theme-primary)", color: "#fff" }}>
                        <Plus className="w-3 h-3" /> assign
                      </button>
                    )}
                  </div>
                  {assignments.length === 0 ? (
                    <div className="text-center py-10 font-mono"><LayoutList className="w-8 h-8 mx-auto mb-3 opacity-20" /><p className="text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// no assignments yet</p>{canManage && <p className="text-xs mt-1 text-muted-foreground">Assign a quiz to the group.</p>}</div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((a) => {
                        const tl = timeLeft(a.due_at);
                        const isOverdue = tl === "overdue";
                        const completionPct = Math.round(((a.completion_count ?? 0) / (a.member_count ?? 1)) * 100);
                        return (
                          <div key={a.id} className="rounded-2xl border p-4" style={{ borderColor: a.my_completion ? "rgb(34 197 94 / 0.2)" : isOverdue ? "rgb(239 68 68 / 0.2)" : `rgb(var(--theme-glow) / 0.12)`, backgroundColor: a.my_completion ? "rgb(34 197 94 / 0.03)" : `rgb(var(--theme-glow) / 0.02)` }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{a.quiz_title}</p><p className="font-mono text-[10px] mt-0.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>assigned by @{a.assigner_username}</p></div>
                              {canManage && (<button onClick={async () => { await deleteAssignment(a.id); setAssignments((p) => p.filter((x) => x.id !== a.id)); }} className="p-1 opacity-30 hover:opacity-60 transition-opacity shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>)}
                            </div>
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                                <span>{a.completion_count}/{a.member_count} done</span>
                                {tl && (<span className="flex items-center gap-1" style={{ color: isOverdue ? "#ef4444" : `rgb(var(--theme-glow) / 0.4)` }}><Clock className="w-3 h-3" />{tl}</span>)}
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, backgroundColor: completionPct === 100 ? "#22c55e" : `rgb(${style.glow})` }} />
                              </div>
                            </div>
                            <div className="mt-3">
                              {a.my_completion ? (
                                <div className="flex items-center gap-2 font-mono text-xs" style={{ color: "#22c55e" }}>✓ completed · {Math.round((a.my_completion.score / 10) * 100)}%</div>
                              ) : (
                                <button onClick={() => router.push(`/quizzes/study/${a.quiz_id}?assignment=${a.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all" style={{ background: "var(--theme-primary)", color: "#fff" }}>
                                  <Zap className="w-3 h-3" /> start quiz
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ MEMBERS TAB ══ */}
              {tab === "members" && (
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>// MEMBERS</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
                    <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>{members.length}/20</span>
                  </div>
                  <div className="space-y-2.5">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-2xl border p-3.5" style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                        <Avatar username={m.username ?? "?"} avatar={m.avatar_url} size={9} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{m.username}</span>
                            {m.role !== "member" && (<span className="font-mono text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `rgb(${style.glow} / 0.12)`, color: `rgb(${style.glow})` }}>{m.role === "owner" ? "👑 owner" : "🛡 admin"}</span>)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                            <Flame className="w-2.5 h-2.5" style={{ color: "#f97316" }} />{m.streak ?? 0} streak
                          </div>
                        </div>
                        {isOwner && m.user_id !== currentUserId && (
                          <div className="flex items-center gap-1 shrink-0">
                            {m.role === "member" ? (
                              <button onClick={async () => { await updateMemberRole(group.id, m.user_id, "admin"); setMembers((p) => p.map((x) => x.user_id === m.user_id ? { ...x, role: "admin" } : x)); }} title="Make admin" className="p-1.5 rounded-lg border transition-all" style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, color: `rgb(var(--theme-glow) / 0.4)` }}><Shield className="w-3.5 h-3.5" /></button>
                            ) : (
                              <button onClick={async () => { await updateMemberRole(group.id, m.user_id, "member"); setMembers((p) => p.map((x) => x.user_id === m.user_id ? { ...x, role: "member" } : x)); }} title="Remove admin" className="p-1.5 rounded-lg border transition-all" style={{ borderColor: `rgb(${style.glow} / 0.3)`, color: `rgb(${style.glow})` }}><Shield className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={async () => { await kickMember(group.id, m.user_id); setMembers((p) => p.filter((x) => x.user_id !== m.user_id)); setGroup((g) => g ? { ...g, member_count: (g.member_count ?? 1) - 1 } : g); }} title="Kick member" className="p-1.5 rounded-lg transition-all" style={{ color: `rgb(var(--theme-glow) / 0.3)` }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={(e) => (e.currentTarget.style.color = `rgb(var(--theme-glow) / 0.3)`)}><UserX className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupDetailPage;