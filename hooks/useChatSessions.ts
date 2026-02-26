"use client";

import * as React from "react";
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  renameChatSession,
  getChatMessages,
  saveChatMessage,
  ChatSession,
  ChatMessage,
} from "@/lib/db";

export interface Message {
  role: "user" | "assistant";
  content: string;
  attachedFileName?: string;
}

export interface UseChatSessionsReturn {
  // Session list (for sidebar)
  sessions: ChatSession[];
  loadingSessions: boolean;
  activeSessionId: string | null;

  // Messages for active session
  messages: Message[];
  loadingMessages: boolean;

  // Actions (for sidebar + chat page)
  selectSession: (id: string) => Promise<void>;
  startNewChat: (title: string) => Promise<ChatSession | null>;
  removeSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;

  // Called by ChatPage after stream completes
  persistExchange: (
    userContent: string,
    assistantContent: string,
    attachedFileName?: string | null,
  ) => Promise<void>;

  // Optimistically append the streaming assistant message
  setStreamingMessage: (content: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: () => void;
}

export function useChatSessions(): UseChatSessionsReturn {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = React.useState(true);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = React.useState(false);

  // Load sessions on mount + auto-select most recent
  React.useEffect(() => {
    const init = async () => {
      const data = await getChatSessions();
      setSessions(data);
      setLoadingSessions(false);
      if (data.length > 0) {
        await loadMessages(data[0].id);
        setActiveSessionId(data[0].id);
      }
    };
    init();
  }, []);

  const loadMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    const raw = await getChatMessages(sessionId);
    setMessages(
      raw.map((m) => ({
        role: m.role,
        content: m.content,
        attachedFileName: m.attached_file_name ?? undefined,
      })),
    );
    setLoadingMessages(false);
  };

  const selectSession = async (id: string) => {
    if (id === activeSessionId) return;
    setActiveSessionId(id);
    await loadMessages(id);
  };

  const startNewChat = async (title: string): Promise<ChatSession | null> => {
    const session = await createChatSession(title);
    if (!session) return null;
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
    return session;
  };

  const removeSession = async (id: string) => {
    await deleteChatSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        await loadMessages(remaining[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  const renameSession = async (id: string, title: string) => {
    await renameChatSession(id, title);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s)),
    );
  };

  // Optimistic streaming helpers — append to last assistant bubble
  const setStreamingMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  };

  const appendStreamChunk = (chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          content: last.content + chunk,
        };
      }
      return updated;
    });
  };

  const finalizeStream = () => {
    // Nothing needed — message is already in state.
    // persistExchange will save to DB after this.
  };

  const persistExchange = async (
    userContent: string,
    assistantContent: string,
    attachedFileName?: string | null,
  ) => {
    if (!activeSessionId) return;
    await saveChatMessage(activeSessionId, "user", userContent, attachedFileName);
    await saveChatMessage(activeSessionId, "assistant", assistantContent);

    // Bump session to top of list
    setSessions((prev) => {
      const session = prev.find((s) => s.id === activeSessionId);
      if (!session) return prev;
      const updated = { ...session, updated_at: new Date().toISOString() };
      return [updated, ...prev.filter((s) => s.id !== activeSessionId)];
    });
  };

  return {
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
    finalizeStream,
  };
}