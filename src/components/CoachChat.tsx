"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

import type { CoachQuestionPayload } from "@/lib/riot";
import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
}

interface CoachChatProps {
  matchId: string;
  currentTime: number;
  gameName?: string;
  tagLine?: string;
}

const SUGGESTIONS = [
  "Why did I die at 10:12?",
  "Was my dragon trade good?",
  "How can I snowball my lead?",
];

const SYSTEM_PROMPT = "You are a concise League of Legends coach.";

export function CoachChat({ matchId, currentTime, gameName, tagLine }: CoachChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      const historyMessages = messages
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({
          role: message.role === "coach" ? "assistant" : "user",
          content: message.content,
        }));

      const payload: CoachQuestionPayload = {
        matchId,
        question: question.trim(),
        currentTime,
        ...(gameName ? { gameName } : {}),
        ...(tagLine ? { tagLine } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...historyMessages,
          { role: "user", content: question.trim() },
        ],
      };

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: question.trim(),
      };

      const assistantId = `coach-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "coach",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          let errorMessage = errorText || `Coach responded with ${response.status}`;
          if (errorText) {
            try {
              const parsed = JSON.parse(errorText);
              if (typeof parsed?.error === "string") {
                errorMessage = parsed.error;
              } else if (typeof parsed?.message === "string") {
                errorMessage = parsed.message;
              }
            } catch {
              // ignore JSON parse errors
            }
          }
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error("No stream received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamed = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          streamed += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: streamed } : message,
            ),
          );
        }
      } catch (error) {
        const fallbackMessage =
          error instanceof Error && error.message
            ? error.message
            : "Coach is unavailable right now. Please try again in a moment.";
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: fallbackMessage,
                }
              : message,
          ),
        );
        console.error("[CoachChat] Failed to stream response", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [currentTime, gameName, matchId, messages, tagLine],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = inputRef.current?.value ?? "";
      if (!value.trim()) return;
      sendMessage(value);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [sendMessage],
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
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl">
      <div>
        <h3 className="font-heading text-lg text-slate-100">Coach</h3>
        <p className="text-sm text-slate-300/75">
          Ask contextual questions as you scrub the timeline.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{suggestionButtons}</div>
      <div className="flex-1 space-y-4 overflow-auto rounded-2xl bg-slate-900/45 p-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
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
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            rows={2}
            placeholder="Ask your coach…"
            className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-violet-400 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                sendMessage(event.currentTarget.value);
                event.currentTarget.value = "";
              }
            }}
            aria-label="Chat with coach"
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
    </div>
  );
}
