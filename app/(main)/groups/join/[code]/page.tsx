"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { joinGroupByCode, getGroup, Group, COVER_STYLES, GroupCover } from "@/lib/db";
import { Terminal, Users, Hash, Loader2, ArrowRight } from "lucide-react";

const JoinGroupPage = () => {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [state, setState] = useState<"loading" | "preview" | "joining" | "error">("loading");
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We can't preview the group without joining (RLS requires membership).
    // So we go straight to the join action on mount.
    const join = async () => {
      if (!code) { setState("error"); setError("Invalid link"); return; }

      // Check if already a member by trying to join (joinGroupByCode is idempotent)
      const { data, error: err } = await joinGroupByCode(code.toUpperCase());

      if (err || !data) {
        setError(err ?? "Failed to join group");
        setState("error");
        return;
      }

      // Fetch full group details now that we're a member
      const full = await getGroup(data.id);
      setGroup(full ?? data);
      setState("preview");
    };
    join();
  }, [code, router]);

  const handleEnter = () => {
    if (group) router.push(`/groups/${group.id}`);
  };

  if (state === "loading" || state === "joining") return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-3 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "var(--theme-primary)" }} />
        <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>joining group...</p>
      </div>
    </div>
  );

  if (state === "error") return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
      <p className="font-mono text-sm" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// join_failed</p>
      <p className="font-bold text-lg">Could not join group</p>
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={() => router.push("/groups")}
        className="text-sm font-mono mt-2" style={{ color: "var(--theme-primary)" }}>
        ← back_to_groups
      </button>
    </div>
  );

  if (state === "preview" && group) {
    const style = COVER_STYLES[group.cover as GroupCover] ?? COVER_STYLES.purple;
    return (
      <>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        `}</style>

        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
          <div className="w-full max-w-sm page-enter space-y-5">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/groups/join</span>
            </div>

            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              {/* Color strip */}
              <div className="h-2 w-full" style={{ background: style.bg }} />

              <div className="p-6 space-y-4">
                <div>
                  <p className="font-mono text-[10px] mb-1" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// you joined</p>
                  <h1 className="text-2xl font-black">{group.name}</h1>
                  {group.subject && (
                    <div className="flex items-center gap-1 mt-1">
                      <Hash className="w-3 h-3" style={{ color: `rgb(${style.glow})` }} />
                      <span className="font-mono text-xs" style={{ color: `rgb(${style.glow})` }}>{group.subject}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  <Users className="w-3.5 h-3.5" />
                  {group.member_count} member{(group.member_count ?? 0) !== 1 ? "s" : ""}
                </div>

                <div className="rounded-xl border px-4 py-3 font-mono text-xs"
                  style={{ borderColor: "rgb(34 197 94 / 0.2)", backgroundColor: "rgb(34 197 94 / 0.05)", color: "#22c55e" }}>
                  ✓ You're now a member
                </div>
              </div>
            </div>

            <button
              onClick={handleEnter}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: style.bg, color: "#fff" }}
            >
              enter group <ArrowRight className="w-4 h-4" />
            </button>

            <button onClick={() => router.push("/groups")}
              className="w-full text-center font-mono text-xs"
              style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
              ← all groups
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default JoinGroupPage;