"use client";

import { FormEvent, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Maximize2, Minimize2 } from "lucide-react";

import type { CoachQuestionPayload } from "@/lib/riot";
import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
}

interface CoachChatProps {
  matchId: string;
  currentTime: number;
  puuid?: string;
  gameName?: string;
  tagLine?: string;
  className?: string;
}

const SUGGESTIONS = [
  "Was my dragon trade good?",
  "How can I snowball my lead?",
];

const MAX_HISTORY = 8; // keep context small and cheap

export function CoachChat({ matchId, currentTime, puuid, gameName, tagLine, className }: CoachChatProps) {
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

      // Build short history (user/assistant only) — *no* system entry here.
      const historyMessages = messages
        .filter((m) => m.content.trim().length > 0)
        .slice(-MAX_HISTORY)
        .map((m) => ({
          role: m.role === "coach" ? "assistant" as const : "user" as const,
          content: m.content,
        }));

      // *** KEY CHANGE ***
      // Do NOT include system in messages. Send as `system` sibling field instead.
      const payload: CoachQuestionPayload = {
        matchId,
        question: text,
        currentTime,
        ...(puuid ? { puuid } : {}),
        ...(gameName ? { gameName } : {}),
        ...(tagLine ? { tagLine } : {}),
        messages: [
          ...historyMessages,
          { role: "user", content: text }, // first message is always user for Bedrock
        ],
      };

      // Optimistic UI
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
              // ignore parse error; keep msg
            }
          }
          throw new Error(msg);
        }

        if (!response.body) throw new Error("No stream received");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let streamed = "";
        // stream plain text (works whether your server sends raw chunks or newline-delimited)
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
        console.error("[CoachChat] Failed to stream response", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [currentTime, puuid, gameName, isStreaming, matchId, messages, tagLine],
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

const baseClasses = "flex flex-col rounded-3xl transition-all duration-300";
const collapsedClasses = cn(
  "relative h-full max-h-full border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-lg max-h-[46rem] min-h-[360px] w-full",
  className,
);
const expandedClasses =
  "fixed inset-y-6 right-6 z-50 flex max-h-[calc(100vh-3rem)] w-[min(720px,calc(100vw-3rem))] border border-violet-400/40 bg-slate-950/95 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl";

return (
  <motion.div
    className={cn(baseClasses, isExpanded ? expandedClasses : collapsedClasses)}
      layout
    >
      <div className="flex items-center justify-between p-4 pb-3">
        <div>
          <h3 className="font-heading text-lg text-slate-100">Chat Coach</h3>
          <p className="text-xs text-slate-300/75">
            Ask contextual questions as you scrub the timeline.
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

      <div className="flex flex-wrap gap-2 px-4 pb-3">{suggestionButtons}</div>

      <div
        className={cn(
          "flex-1 min-h-0 space-y-4 overflow-y-auto rounded-2xl bg-slate-900/45 p-4 mx-4 mb-3",
          "scrollbar-thin scrollbar-thumb-violet-500/30 scrollbar-track-transparent",
        )}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm text-slate-400/75">
                Start a conversation with your coach by asking a question or selecting a suggestion above.
              </p>
              <p className="text-xs text-slate-500/60">
                Your coach analyzes the match context and timeline to provide personalized insights.
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

      <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 pt-0">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            rows={isExpanded ? 3 : 2}
            placeholder={isStreaming ? "Coach is thinking…" : "Ask your coach…"}
            className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-violet-400 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
