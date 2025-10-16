"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
}

interface ProfileCoachChatProps {
  gameName: string;
  tagLine: string;
  profileSummary?: string;
}

const SUGGESTIONS = [
  "How can I improve my gameplay?",
  "What champions should I focus on?",
  "Analyze my recent performance",
];

const SYSTEM_PROMPT = "You are a concise League of Legends coach analyzing a player's profile and statistics.";

const MAX_HISTORY = 8;

export function ProfileCoachChat({ gameName, tagLine, profileSummary }: ProfileCoachChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

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
    [gameName, tagLine, profileSummary, isStreaming, messages],
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
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl shadow-lg">
      <div>
        <h3 className="font-heading text-lg text-slate-100">Profile Coach</h3>
        <p className="text-xs text-slate-300/75">
          Ask questions about your performance, champion pool, or get personalized advice.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">{suggestionButtons}</div>

      <div className="space-y-3 overflow-auto rounded-2xl bg-slate-900/45 p-3 min-h-[200px] max-h-[250px]">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-slate-400/75">
              Start a conversation with your coach by asking a question or selecting a suggestion above.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "coach"
                    ? "bg-violet-500/15 text-violet-100"
                    : "ml-auto bg-white/10 text-slate-100",
                )}
              >
                {message.content || (
                  <span className="flex items-center gap-2 text-slate-300/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            rows={1}
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
          {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

