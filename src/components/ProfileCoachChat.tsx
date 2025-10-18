"use client";

import { FormEvent, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Maximize2, Minimize2 } from "lucide-react";

import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
}

interface ProfileCoachChatProps {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileSummary?: string;
}

const SUGGESTIONS = [
  "How can I improve my gameplay?",
  "What champions should I focus on?",
  "Analyze my recent performance",
];

const MAX_HISTORY = 8;

export function ProfileCoachChat({ puuid, gameName, tagLine, profileSummary }: ProfileCoachChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || isStreaming) return;

      const historyMessages = messages
        .filter((m) => m.content.trim().length > 0)
        .slice(-MAX_HISTORY)
        .map((m) => ({
          role: m.role === "coach" ? "assistant" as const : "user" as const,
          content: m.content,
        }));

      // Build a context-aware payload for profile questions
      const contextMessage = profileSummary 
        ? `Context: ${profileSummary}\n\nQuestion: ${text}`
        : text;

      const payload = {
        matchId: "profile", // Special identifier for profile-based queries
        question: contextMessage,
        currentTime: 0,
        puuid,
        gameName,
        tagLine,
        messages: [
          ...historyMessages,
          { role: "user", content: contextMessage },
        ],
      };

      const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: text };
      const assistantId = `coach-${Date.now()}`;
      const assistantMessage: Message = { id: assistantId, role: "coach", content: "" };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const raw = await response.text().catch(() => "");
          let msg = raw || `Coach responded with ${response.status}`;
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (typeof parsed?.error === "string") msg = parsed.error;
              else if (typeof parsed?.message === "string") msg = parsed.message;
            } catch {
              // ignore parse error
            }
          }
          throw new Error(msg);
        }

        if (!response.body) throw new Error("No stream received");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let streamed = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          streamed += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: streamed } : m)),
          );
        }
      } catch (error) {
        const fallback =
          error instanceof Error && error.message
            ? error.message
            : "Coach is unavailable right now. Please try again in a moment.";
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fallback } : m)),
        );
        console.error("[ProfileCoachChat] Failed to stream response", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [puuid, gameName, tagLine, profileSummary, isStreaming, messages],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = inputRef.current?.value ?? "";
      if (!value.trim() || isStreaming) return;
      sendMessage(value);
      if (inputRef.current) inputRef.current.value = "";
    },
    [isStreaming, sendMessage],
  );

  const suggestionButtons = useMemo(
    () =>
      SUGGESTIONS.map((text) => (
        <Button
          key={text}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => sendMessage(text)}
          className="border-violet-400/50 bg-violet-500/10 text-violet-100"
          disabled={isStreaming}
        >
          {text}
        </Button>
      )),
    [isStreaming, sendMessage],
  );

  return (
    <motion.div
      className={cn(
        "flex flex-col gap-3 rounded-3xl border p-4 backdrop-blur-xl shadow-lg transition-all duration-300",
        isExpanded
          ? "fixed inset-4 z-50 border-violet-400/40 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-violet-500/20"
          : "border-white/10 bg-slate-950/70",
      )}
      layout
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg text-slate-100">Profile Coach</h3>
          <p className="text-xs text-slate-300/75">
            Ask questions about your performance, champion pool, or get personalized advice.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-violet-300 hover:bg-violet-500/10"
          title={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">{suggestionButtons}</div>

      <div
        className={cn(
          "space-y-4 overflow-auto rounded-2xl bg-slate-900/45 p-4",
          "scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent",
          isExpanded ? "flex-1" : "min-h-[200px] max-h-[250px]",
        )}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm text-slate-400/75">
                Start a conversation with your coach by asking a question or selecting a suggestion above.
              </p>
              <p className="text-xs text-slate-500/60">
                Your coach analyzes your profile statistics and match history.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {message.content ? (
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    isStreaming={isStreaming && message.role === "coach"}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-300/70 px-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking…</span>
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            rows={isExpanded ? 2 : 1}
            placeholder={isStreaming ? "Coach is thinking…" : "Ask your coach…"}
            className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-violet-400 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                if (!isStreaming) {
                  const val = event.currentTarget.value;
                  if (val.trim()) sendMessage(val);
                  event.currentTarget.value = "";
                }
              }
            }}
            aria-label="Chat with coach"
            disabled={isStreaming}
          />
        </div>
        <Button type="submit" size="sm" disabled={isStreaming}>
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Backdrop when expanded */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 -z-10 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </motion.div>
  );
}
