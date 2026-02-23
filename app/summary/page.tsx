"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, X, Sparkles, FileText } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface StoredFile {
  id: string
  name: string
  text: string
}

const SummaryPage = () => {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<StoredFile | null>(null)
  const [showFileMenu, setShowFileMenu] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [storedFiles, setStoredFiles] = React.useState<StoredFile[]>([])
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const stored = localStorage.getItem("retainly_files")
    if (stored) setStoredFiles(JSON.parse(stored))
  }, [])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return

    const userMessage = selectedFile
      ? `Summarize this file: ${selectedFile.name}`
      : input

    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setLoading(true)

    try {
      const formData = new FormData()
      if (selectedFile) {
        formData.append("text", selectedFile.text)
      } else {
        formData.append("text", input)
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.output.summary }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Something went wrong. Please try again." },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to connect to the server." },
      ])
    } finally {
      setLoading(false)
      setSelectedFile(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-10 space-y-6">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `rgb(var(--theme-glow) / 0.1)` }}
            >
              <Sparkles className="w-8 h-8" style={{ color: "var(--theme-primary)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-black mb-2">Summary</h1>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                Paste any text or select an uploaded file and get an AI-generated summary instantly.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Summarize a paragraph", "Upload a PDF", "Paste lecture notes"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.25)`,
                    color: "var(--theme-badge-text)",
                    backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Assistant avatar */}
            {msg.role === "assistant" && (
              <div
                className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: `rgb(var(--theme-glow) / 0.12)` }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
              </div>
            )}

            <div
              className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
              style={
                msg.role === "user"
                  ? {
                      background: "var(--theme-gradient)",
                      color: "var(--theme-button-text)",
                    }
                  : {
                      backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                      border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                      color: "var(--foreground)",
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div
              className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: `rgb(var(--theme-glow) / 0.12)` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex items-center gap-2"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                border: `1px solid rgb(var(--theme-glow) / 0.15)`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--theme-primary)", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--theme-primary)", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--theme-primary)", animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div
        className="px-6 py-4 mb-4 mx-6 rounded-2xl border"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.2)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
        }}
      >
        {/* Selected file pill */}
        {selectedFile && (
          <div className="flex items-center gap-2 mb-3">
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

        {/* File picker dropdown */}
        {showFileMenu && (
          <div
            className="mb-3 rounded-xl border shadow-xl p-2 space-y-1 max-h-48 overflow-y-auto"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              backgroundColor: "var(--background)",
            }}
          >
            {storedFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-2">No files uploaded yet.</p>
            ) : (
              storedFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => { setSelectedFile(file); setShowFileMenu(false); }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2 text-muted-foreground transition-all"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
                    (e.currentTarget as HTMLButtonElement).style.color = `var(--theme-badge-text)`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "";
                  }}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {file.name}
                </button>
              ))
            )}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowFileMenu((prev) => !prev)}
            className="p-2 rounded-xl transition-all shrink-0"
            style={{ color: showFileMenu ? "var(--theme-primary)" : "" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.1)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
            title="Select a file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            className="flex-1 resize-none bg-transparent rounded-xl px-2 py-2 text-sm outline-none min-h-[36px] max-h-[160px] placeholder:text-muted-foreground/50"
            placeholder="Paste text here or select a file..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !selectedFile)}
            className="p-2.5 rounded-xl shrink-0 transition-all disabled:opacity-30"
            style={{ background: "var(--theme-gradient)", color: "var(--theme-button-text)" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground/40 mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

export default SummaryPage