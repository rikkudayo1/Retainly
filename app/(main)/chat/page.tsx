"use client";

import * as React from "react";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  FileText,
  Plus,
  ImageIcon,
} from "lucide-react";
import { getFiles, DBFile } from "@/lib/db";
import MarkdownContent from "@/components/MarkdownContent";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useLanguage } from "@/context/LanguageContext";
import { ImageState } from "@/components/ImageAttachment";

// ─── New Chat Modal ───────────────────────────────────────────

const NewChatModal = ({
  onConfirm,
  onClose,
}: {
  onConfirm: (title: string) => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => { const trimmed = title.trim(); if (trimmed) onConfirm(trimmed); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4"
        style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.2)` }}
      >
        <div>
          <h2 className="text-base font-black">{t("chat.new")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("chat.new_name")}</p>
        </div>
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.2)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
            color: "var(--foreground)",
          }}
          placeholder={t("chat.name_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.2)`; }}
          maxLength={60}
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: "var(--muted-foreground)" }}
          >
            {t("chat.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: "var(--theme-primary)", color: "#fff" }}
          >
            {t("chat.start")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Rename inline input ──────────────────────────────────────

const RenameInput = ({
  defaultValue,
  onConfirm,
  onCancel,
}: {
  defaultValue: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}) => {
  const [val, setVal] = React.useState(defaultValue);
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      className="outline-none bg-transparent text-xs w-24 border-b"
      style={{ borderColor: "var(--theme-primary)", color: "var(--foreground)" }}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") { const trimmed = val.trim(); if (trimmed) onConfirm(trimmed); }
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => { const trimmed = val.trim(); if (trimmed) onConfirm(trimmed); else onCancel(); }}
      maxLength={60}
    />
  );
};

// ─── Single Tab ───────────────────────────────────────────────

const ChatTab = ({
  title,
  isActive,
  onClick,
  onClose,
  onRename,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  onRename: (newTitle: string) => void;
}) => {
  const [renaming, setRenaming] = React.useState(false);
  const { t } = useLanguage();

  return (
    <div
      className="group relative flex items-center gap-2 px-4 py-0 shrink-0 cursor-pointer select-none transition-all"
      style={{
        height: "100%",
        borderRight: `1px solid rgb(var(--theme-glow) / 0.1)`,
        backgroundColor: isActive ? "var(--background)" : "transparent",
        borderBottom: isActive ? "2px solid var(--theme-primary)" : "2px solid transparent",
        borderTop: isActive ? `1px solid rgb(var(--theme-glow) / 0.15)` : "1px solid transparent",
      }}
      onClick={onClick}
      onDoubleClick={() => setRenaming(true)}
      title={t("chat.rename_hint")}
    >
      <Sparkles
        className="w-3 h-3 shrink-0"
        style={{ color: isActive ? "var(--theme-primary)" : "var(--muted-foreground)", opacity: isActive ? 1 : 0.5 }}
      />

      {renaming ? (
        <RenameInput
          defaultValue={title}
          onConfirm={(newTitle) => { onRename(newTitle); setRenaming(false); }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <span
          className="text-sm max-w-[140px] truncate"
          style={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
        >
          {title}
        </span>
      )}

      <button
        className="w-4 h-4 rounded flex items-center justify-center transition-opacity shrink-0"
        style={{ color: "var(--muted-foreground)" }}
        onClick={onClose}
        title={t("chat.cancel")}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.15)`;
          (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
        }}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

// ─── Main ChatPage ────────────────────────────────────────────

const ChatPage = () => {
  const {
    sessions,
    loadingSessions,
    activeSessionId,
    messages,
    loadingMessages,
    selectSession,
    startNewChat,
    removeSession,
    renameSession,
    persistExchange,
    setStreamingMessage,
    appendStreamChunk,
  } = useChatSessions();

  const { t } = useLanguage();
  const [input, setInput] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<DBFile | null>(null);
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [storedFiles, setStoredFiles] = React.useState<DBFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);
  const [contextFile, setContextFile] = React.useState<DBFile | null>(null);
  const [showNewChatModal, setShowNewChatModal] = React.useState(false);
  const [image, setImage] = React.useState<ImageState>(null);

  const pendingUserMsgRef = React.useRef<{
    role: "user";
    content: string;
    attachedFileName?: string;
    attachedImageName?: string;
  } | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const attachMenuRef = React.useRef<HTMLDivElement>(null);
  const tabBarRef = React.useRef<HTMLDivElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    getFiles().then((data) => { setStoredFiles(data); setLoadingFiles(false); });
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => { setContextFile(null); }, [activeSessionId]);

  React.useEffect(() => {
    if (!activeSessionId || !tabBarRef.current) return;
    const activeTab = tabBarRef.current.querySelector(`[data-session-id="${activeSessionId}"]`);
    activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeSessionId]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node))
        setShowAttachMenu(false);
    };
    if (showAttachMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAttachMenu]);

  const displayMessages = React.useMemo(() => {
    if (!pendingUserMsgRef.current) return messages;
    const msgs = [...messages];
    if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
      msgs.splice(msgs.length - 1, 0, pendingUserMsgRef.current);
    } else {
      msgs.push(pendingUserMsgRef.current);
    }
    return msgs;
  }, [messages]);

  const handleImageFile = (file: File) => {
    const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
    if (!ACCEPTED.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setImage({ base64, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text && !selectedFile && !image) return;
    if (!activeSessionId) { setShowNewChatModal(true); return; }

    const attachedFile = selectedFile ?? null;
    if (attachedFile) setContextFile(attachedFile);

    const userContent = text
      || (image ? `Attached image: ${image.name}` : `Attached file: ${attachedFile?.name}`);

    const historyForApi = [
      ...messages,
      { role: "user" as const, content: userContent },
    ];

    const imageCopy = image;
    setInput("");
    setSelectedFile(null);
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    pendingUserMsgRef.current = {
      role: "user",
      content: userContent,
      attachedFileName: attachedFile?.name,
      attachedImageName: imageCopy?.name,
    };
    setStreamingMessage("");

    const activeFile = attachedFile ?? contextFile;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi.map(({ role, content }) => ({ role, content })),
          fileText: activeFile?.text ?? null,
          imageBase64: imageCopy?.base64 ?? null,
          imageMimeType: imageCopy?.mimeType ?? null,
          imageName: imageCopy?.name ?? null,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        appendStreamChunk(chunk);
      }

      await persistExchange(userContent, accumulated, attachedFile?.name);
    } catch {
      appendStreamChunk(`\n\n${t("chat.error")}`);
    } finally {
      pendingUserMsgRef.current = null;
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <>
      {showNewChatModal && (
        <NewChatModal
          onConfirm={async (title) => { setShowNewChatModal(false); await startNewChat(title); }}
          onClose={() => setShowNewChatModal(false)}
        />
      )}

      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">

        {/* ── Tab Bar ── */}
        <div
          className="flex items-stretch shrink-0 border-b overflow-hidden"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.12)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            height: 48,
          }}
        >
          <div
            ref={tabBarRef}
            className="flex items-stretch overflow-x-auto flex-1 min-w-0"
            style={{ scrollbarWidth: "none" }}
          >
            <style>{`.tab-bar::-webkit-scrollbar { display: none; }`}</style>

            {loadingSessions ? (
              <div className="flex items-center gap-px px-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-5 w-24 rounded animate-pulse mx-1"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center px-4">
                <span className="text-xs text-muted-foreground/40">{t("chat.no_chats")}</span>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} data-session-id={session.id} style={{ height: "100%" }}>
                  <ChatTab
                    title={session.title}
                    isActive={session.id === activeSessionId}
                    onClick={() => selectSession(session.id)}
                    onClose={(e) => { e.stopPropagation(); removeSession(session.id); }}
                    onRename={(newTitle) => renameSession(session.id, newTitle)}
                  />
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center justify-center px-3 shrink-0 border-l transition-all"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.1)`,
              color: "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
              (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
            }}
            title={t("chat.new")}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Active session title bar ── */}
        {activeSession && (
          <div
            className="flex items-center gap-2 px-5 py-2 border-b shrink-0"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.08)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.01)`,
            }}
          >
            <span className="text-xs text-muted-foreground/50 truncate">
              {activeSession.title}
            </span>
            {contextFile && (
              <span
                className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ml-auto"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.25)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.07)`,
                  color: "var(--theme-badge-text)",
                }}
              >
                <FileText className="w-3 h-3" />
                {contextFile.name}
                <button onClick={() => setContextFile(null)} className="ml-0.5 hover:opacity-60">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">

          {/* No session */}
          {!activeSessionId && !loadingSessions && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `rgb(var(--theme-glow) / 0.1)` }}
              >
                <Sparkles className="w-8 h-8" style={{ color: "var(--theme-primary)" }} />
              </div>
              <div>
                <h1 className="text-2xl font-black mb-2">{t("chat.title")}</h1>
                <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                  {t("chat.empty")}
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "var(--theme-primary)", color: "#fff" }}
              >
                <Plus className="w-4 h-4" /> {t("chat.new")}
              </button>
            </div>
          )}

          {/* Loading messages */}
          {loadingMessages && (
            <div className="flex items-center justify-center h-full">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }}
              />
            </div>
          )}

          {/* Empty session */}
          {activeSessionId && !loadingMessages && displayMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Sparkles className="w-8 h-8 opacity-20" style={{ color: "var(--theme-primary)" }} />
              <p className="text-sm text-muted-foreground/50">
                {t("chat.session_empty")}
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {!loadingMessages && displayMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: `rgb(var(--theme-glow) / 0.12)` }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
                </div>
              )}
              <div className="flex flex-col gap-1 min-w-0" style={{ maxWidth: "min(42rem, calc(100vw - 5rem))" }}>
                {/* File attachment badge */}
                {msg.role === "user" && msg.attachedFileName && (
                  <div className="flex justify-end">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.3)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                        color: "var(--theme-badge-text)",
                      }}
                    >
                      <FileText className="w-3 h-3" />
                      {msg.attachedFileName}
                    </span>
                  </div>
                )}
                {/* Image attachment badge */}
                {msg.role === "user" && msg.attachedImageName && (
                  <div className="flex justify-end">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.3)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                        color: "var(--theme-badge-text)",
                      }}
                    >
                      <ImageIcon className="w-3 h-3" />
                      {msg.attachedImageName}
                    </span>
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                  style={
                    msg.role === "user"
                      ? { backgroundColor: "var(--theme-primary)", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }
                      : { backgroundColor: `rgb(var(--theme-glow) / 0.06)`, border: `1px solid rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }
                  }
                >
                  {msg.role === "assistant" ? (
                    msg.content === "" && loading && i === displayMessages.length - 1 ? (
                      <span className="flex items-center gap-1.5 py-0.5">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ backgroundColor: "var(--theme-primary)", animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div className="px-4 sm:px-6 pb-5 shrink-0">
          <div
            className="rounded-2xl border px-4 py-3"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
            }}
          >
            {/* Image preview pill */}
            {image && (
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="relative flex items-center gap-2 px-2 py-1.5 rounded-xl border"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.25)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
                  }}
                >
                  <img
                    src={`data:${image.mimeType};base64,${image.base64}`}
                    alt={image.name}
                    className="w-10 h-10 rounded-lg object-cover border shrink-0"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
                  />
                  <span className="text-xs truncate max-w-[120px]" style={{ color: "var(--theme-badge-text)" }}>
                    {image.name}
                  </span>
                  <button
                    onClick={() => setImage(null)}
                    className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)`, color: "var(--muted-foreground)" }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Selected file pill */}
            {selectedFile && (
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.3)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                    color: "var(--theme-badge-text)",
                  }}
                >
                  <FileText className="w-3 h-3" />
                  {selectedFile.name}
                  <button onClick={() => setSelectedFile(null)} className="ml-1 hover:opacity-60">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            <div className="flex items-end gap-2">

              {/* ── Attach button + popup menu ── */}
              <div className="relative shrink-0" ref={attachMenuRef}>

                {/* Hidden image file input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = "";
                  }}
                />

                {/* Attach menu popup */}
                {showAttachMenu && (
                  <div
                    className="absolute bottom-full left-0 mb-2 rounded-xl border shadow-xl overflow-hidden"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.2)`,
                      backgroundColor: "var(--background)",
                      minWidth: 190,
                    }}
                  >
                    {/* Upload image option */}
                    <button
                      onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground transition-all"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-badge-text)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "";
                      }}
                    >
                      <ImageIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                      Upload image
                    </button>

                    {/* Divider */}
                    <div className="h-px mx-2" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />

                    {/* File library options */}
                    {loadingFiles ? (
                      <div className="p-2 space-y-1">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-8 rounded-lg animate-pulse"
                            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }} />
                        ))}
                      </div>
                    ) : storedFiles.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 px-4 py-2.5">{t("chat.no_files")}</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto">
                        {storedFiles.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => { setSelectedFile(file); setShowAttachMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground transition-all"
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
                              (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-badge-text)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                              (e.currentTarget as HTMLButtonElement).style.color = "";
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                            <span className="truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Paperclip button */}
                <button
                  onClick={() => setShowAttachMenu((p) => !p)}
                  className="p-2 rounded-xl transition-all"
                  style={{ color: showAttachMenu ? "var(--theme-primary)" : "var(--muted-foreground)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.1)`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                  title={t("chat.attach")}
                  disabled={loading || !activeSessionId}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                className="flex-1 resize-none bg-transparent rounded-xl px-2 py-2 text-sm outline-none min-h-[36px] max-h-[160px] placeholder:text-muted-foreground/50"
                placeholder={activeSessionId ? t("chat.placeholder") : t("chat.placeholder_no_session")}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading || !activeSessionId}
              />

              <button
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !selectedFile && !image)}
                className="p-2.5 rounded-xl shrink-0 transition-all disabled:opacity-30"
                style={{ background: "var(--theme-primary)", color: "#fff" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground/40 mt-2 text-center">
              {t("chat.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;