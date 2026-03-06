"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getMyGroups, createGroup,
  Group, GroupCover, GROUP_COVERS, COVER_STYLES, GroupRole
} from "@/lib/db";
import { Terminal, Users, Plus, X, Loader2, ArrowRight, Hash } from "lucide-react";
import { ImageCropModal } from "@/components/ImageCropModal";
import { createClient } from "@/lib/supabase";

// ── Cover picker ───────────────────────────────────────────────
const CoverDot = ({ cover, selected, onClick }: { cover: GroupCover; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-7 h-7 rounded-lg transition-all shrink-0"
    style={{
      background: COVER_STYLES[cover].bg,
      outline: selected ? "2px solid white" : "2px solid transparent",
      outlineOffset: "2px",
      transform: selected ? "scale(1.1)" : "scale(1)",
    }}
  />
);

// ── Discord-style Group card ───────────────────────────────────
const GroupCard = ({ group, onClick }: { group: Group; onClick: () => void }) => {
  const style = COVER_STYLES[group.cover as GroupCover] ?? COVER_STYLES.purple;
  const roleColors: Record<string, string> = {
    owner: "#f59e0b",
    admin: "#3b82f6",
    member: "#6b7280",
  };

  const bannerUrl = (group as any).banner_url as string | null;
  const iconUrl = (group as any).icon_url as string | null;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl overflow-hidden transition-all duration-200 relative flex flex-col"
      style={{ background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgb(${style.glow} / 0.35)`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 32px -8px rgb(${style.glow} / 0.2)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Banner */}
      <div className="w-full relative overflow-hidden" style={{ height: 88, flexShrink: 0, background: bannerUrl ? undefined : style.bg }}>
        {bannerUrl && <img src={bannerUrl} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(26,26,31,0.7) 100%)" }} />
      </div>

      {/* Icon overlapping banner */}
      <div className="px-3 relative" style={{ marginTop: -22 }}>
        <div
          className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{
            background: iconUrl ? "transparent" : `rgb(${style.glow} / 0.15)`,
            boxShadow: "0 0 0 3px #1a1a1f",
          }}
        >
          {iconUrl
            ? <img src={iconUrl} alt="" className="w-full h-full object-cover" />
            : <span className="font-black text-base" style={{ color: `rgb(${style.glow})` }}>{group.name[0].toUpperCase()}</span>
          }
        </div>
      </div>

      {/* Body */}
      <div className="px-3 md:px-4 pt-2 pb-3 md:pb-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm md:text-base truncate leading-tight">{group.name}</p>
            {group.subject && (
              <div className="flex items-center gap-1 mt-0.5">
                <Hash className="w-2.5 h-2.5 shrink-0" style={{ color: `rgb(${style.glow} / 0.6)` }} />
                <span className="font-mono text-[10px] md:text-xs truncate" style={{ color: `rgb(${style.glow} / 0.6)` }}>{group.subject}</span>
              </div>
            )}
          </div>
          <span
            className="shrink-0 font-mono text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5"
            style={{ color: roleColors[group.my_role ?? "member"], background: `${roleColors[group.my_role ?? "member"]}18` }}
          >
            {group.my_role}
          </span>
        </div>

        <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            <span className="font-mono text-[10px] md:text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {group.member_count} member{(group.member_count ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>
          <div
            className="flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg font-bold text-[11px] md:text-xs"
            style={{ background: `rgb(${style.glow} / 0.15)`, color: `rgb(${style.glow})` }}
          >
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </button>
  );
};

// ── Create / Join modal ────────────────────────────────────────
const Modal = ({ onClose, onCreated, onJoined }: {
  onClose: () => void;
  onCreated: (g: Group) => void;
  onJoined: (id: string) => void;
}) => {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [cover, setCover] = useState<GroupCover>("purple");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ file: File; type: "banner" | "icon" } | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const style = COVER_STYLES[cover];

  const handleCropDone = (blob: Blob, type: "banner" | "icon") => {
    const url = URL.createObjectURL(blob);
    const file = new File([blob], `${type}.webp`, { type: "image/webp" });
    if (type === "banner") { setBannerFile(file); setBannerPreview(url); }
    else { setIconFile(file); setIconPreview(url); }
    setCropTarget(null);
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const supabase = createClient();
    const { error } = await supabase.storage.from("group-images").upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("group-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("Group name is required"); return; }
    setLoading(true); setError(null);

    const { data, error: err } = await createGroup({ name: name.trim(), subject: subject.trim() || undefined, cover });
    if (err || !data) { setError(err ?? "Failed to create group"); setLoading(false); return; }

    const supabase = createClient();
    const updates: Record<string, string> = {};
    if (bannerFile) { const url = await uploadImage(bannerFile, `${data.id}/banner.webp`); if (url) updates.banner_url = url; }
    if (iconFile) { const url = await uploadImage(iconFile, `${data.id}/icon.webp`); if (url) updates.icon_url = url; }

    let finalGroup = data;
    if (Object.keys(updates).length > 0) {
      const { data: updated } = await supabase.from("groups").update(updates).eq("id", data.id).select().maybeSingle();
      if (updated) finalGroup = updated;
    }

    setLoading(false);
    onCreated(finalGroup);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError("Enter a join code"); return; }
    setLoading(true); setError(null);
    const { joinGroupByCode } = await import("@/lib/db");
    const { data, error: err } = await joinGroupByCode(joinCode.trim());
    setLoading(false);
    if (err || !data) { setError(err ?? "Failed to join group"); return; }
    onJoined(data.id);
  };

  return (
    <>
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

      {/* Hidden inputs */}
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropTarget({ file: f, type: "banner" }); e.target.value = ""; }} />
      <input ref={iconInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropTarget({ file: f, type: "icon" }); e.target.value = ""; }} />

      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#111113" }}
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              {(["create", "join"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(null); }}
                  className="px-4 py-1.5 rounded-md font-mono text-xs transition-all"
                  style={{ backgroundColor: mode === m ? "rgba(255,255,255,0.08)" : "transparent", color: mode === m ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="opacity-30 hover:opacity-70 transition-opacity">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {mode === "create" ? (
              <>
                {/* Banner + Icon */}
                <div className="relative">
                  {/* Banner */}
                  <div
                    className="w-full rounded-xl overflow-hidden relative cursor-pointer group/banner"
                    style={{ height: 90, background: bannerPreview ? "transparent" : style.bg }}                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview && <img src={bannerPreview} alt="" className="w-full h-full object-cover" />}
                    {/* Always-visible upload hint */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: bannerPreview ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.15)" }}>
                      <div className="flex flex-col items-center gap-1 opacity-60 group-hover/banner:opacity-90 transition-opacity">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-mono text-[9px] text-white">upload banner</span>
                      </div>
                    </div>
                  </div>

                  {/* Icon overlapping banner */}
                  <div className="absolute left-3" style={{ bottom: -22 }}>
                    <div
                      className="relative cursor-pointer w-12 h-12 rounded-full overflow-hidden flex items-center justify-center group/icon"
                      style={{ background: iconPreview ? "transparent" : `rgb(${style.glow} / 0.2)`, boxShadow: "0 0 0 3px #111113" }}
                      onClick={() => iconInputRef.current?.click()}
                    >
                      {iconPreview
                        ? <img src={iconPreview} alt="" className="w-full h-full object-cover" />
                        : <span className="font-black text-lg" style={{ color: `rgb(${style.glow})` }}>{name[0]?.toUpperCase() || "?"}</span>
                      }
                      {/* Always-visible camera overlay */}
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                        <span className="font-mono text-[8px] text-white/70 group-hover/icon:text-white/95 transition-colors">icon</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spacer for icon */}
                <div style={{ paddingTop: 18 }} />

                {/* Name */}
                <div>
                  <label className="font-mono text-[10px] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>// group_name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Study Squad" maxLength={40}
                    className="w-full px-3 py-3 rounded-xl text-sm font-mono bg-transparent border outline-none transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--foreground)" }}
                    onFocus={(e) => (e.target.style.borderColor = `rgb(${style.glow})`)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                </div>

                {/* Subject */}
                <div>
                  <label className="font-mono text-[10px] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>// subject (optional)</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology, Math, English..." maxLength={30}
                    className="w-full px-3 py-3 rounded-xl text-sm font-mono bg-transparent border outline-none transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--foreground)" }}
                    onFocus={(e) => (e.target.style.borderColor = `rgb(${style.glow})`)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                </div>

                {/* Cover */}
                <div>
                  <label className="font-mono text-[10px] block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>// color</label>
                  <div className="flex gap-2 flex-wrap">
                    {GROUP_COVERS.map((c) => <CoverDot key={c} cover={c} selected={cover === c} onClick={() => setCover(c)} />)}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="font-mono text-[10px] block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>// join_code</label>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="RET-XXX" maxLength={7}
                  className="w-full px-3 py-3 rounded-xl text-sm font-mono bg-transparent border outline-none transition-all tracking-widest"
                  style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--foreground)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--theme-primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
              </div>
            )}

            {error && <p className="font-mono text-[11px]" style={{ color: "#ef4444" }}>{error}</p>}

            <button
              onClick={mode === "create" ? handleCreate : handleJoin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{ background: "var(--theme-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : mode === "create"
                  ? <><Plus className="w-4 h-4" /> create_group</>
                  : <><ArrowRight className="w-4 h-4" /> join_group</>
              }
            </button>

            {/* Safe area spacer for mobile */}
            <div className="h-2 sm:hidden" />
          </div>
        </div>
      </div>
    </>
  );
};

// ── Page ───────────────────────────────────────────────────────
const GroupsPage = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getMyGroups().then((data) => { setGroups(data); setLoading(false); });
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1 { animation-delay: 60ms; }
      `}</style>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onCreated={(g) => {
            setGroups((p) => [{ ...g, member_count: 1, my_role: "owner" }, ...p]);
            setShowModal(false);
            router.push(`/groups/${g.id}`);
          }}
          onJoined={(id) => { setShowModal(false); router.push(`/groups/${id}`); }}
        />
      )}

      <div className="min-h-screen bg-background text-foreground pb-24">
        <div className="max-w-4xl mx-auto px-5 md:px-8 pt-10 md:pt-16 space-y-8 md:space-y-10">

          {/* Header */}
          <div className="page-enter flex items-start justify-between gap-4">
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-2 font-mono text-[11px] md:text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>~/retainly/groups</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Groups</h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xs md:max-w-sm leading-relaxed">
                Study together, compete on leaderboards, and tackle assignments.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-mono text-xs md:text-sm transition-all mt-6 md:mt-8"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> new
            </button>
          </div>

          {/* Groups grid */}
          <div className="page-enter stagger-1">
            {loading ? (
              <div className="flex items-center gap-2 font-mono text-xs md:text-sm py-8" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--theme-primary)" }} />
                loading...
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16 md:py-24 font-mono">
                <Users className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-4 opacity-20" />
                <p className="text-xs md:text-sm" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// no groups yet</p>
                <p className="text-xs md:text-sm mt-1 text-muted-foreground">Create one or join with a code.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-5 flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-mono text-xs md:text-sm mx-auto transition-all"
                  style={{ background: "var(--theme-primary)", color: "#fff" }}
                >
                  <Plus className="w-3.5 h-3.5" /> get started
                </button>
              </div>
            ) : (
              // 1 col mobile → 2 col sm → 3 col lg
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {groups.map((g) => (
                  <GroupCard key={g.id} group={g} onClick={() => router.push(`/groups/${g.id}`)} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default GroupsPage;