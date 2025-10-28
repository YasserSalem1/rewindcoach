"use client";

import { FormEvent, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";

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
  renderMode?: "floating" | "inline";
  className?: string;
}

const SUGGESTIONS = [
  "How can I improve my gameplay?",
  "What champions should I focus on?",
  "Analyze my recent performance",
];

const MAX_HISTORY = 8;

export function ProfileCoachChat({
  puuid,
  gameName,
  tagLine,
  profileSummary,
  renderMode = "floating",
  className,
}: ProfileCoachChatProps) {
  const isInline = renderMode === "inline";
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(renderMode === "inline");
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
        const response = await fetch("/api/profile-chat", {
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

  const suggestionsSection =
    messages.length === 0 ? (
      <div className="flex flex-wrap gap-2 border-b border-white/5 p-4">
        {suggestionButtons}
      </div>
    ) : null;

  const messagesSection = (
    <div
      className={cn(
        "flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4",
        "scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent",
      )}
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center">
          <div className="max-w-xs space-y-3 px-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
              <MessageCircle className="h-8 w-8 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-slate-300">Start a conversation</p>
            <p className="text-xs text-slate-400">
              Ask questions about your performance, champion pool, or get personalized advice.
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {message.content ? (
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  isStreaming={isStreaming && message.role === "coach"}
                />
              ) : (
                <div className="flex items-center gap-2 px-4 text-slate-300/70">
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
  );

  const inputSection = (
    <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            rows={isInline ? 3 : isExpanded ? 3 : 2}
            placeholder={isStreaming ? "Coach is thinking…" : "Ask your coach…"}
            className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none ring-violet-400 transition placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
        <Button
          type="submit"
          size="sm"
          disabled={isStreaming}
          className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-0 hover:from-violet-700 hover:to-purple-800"
        >
          {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </form>
  );

  const header = (
    <div className="flex items-center justify-between border-b border-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-slate-100">Profile Coach</h3>
          <p className="text-xs text-slate-400">Always here to help</p>
        </div>
      </div>
      {!isInline && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-8 w-8 p-0 text-slate-400 hover:bg-violet-500/20 hover:text-white"
            aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setIsExpanded(false);
            }}
            className="h-8 w-8 p-0 text-slate-400 hover:bg-red-500/20 hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return (
      <div
        className={cn(
          "flex h-full flex-col rounded-3xl border border-white/10 bg-slate-950/85 shadow-[0_0_45px_rgba(79,70,229,0.15)]",
          className,
        )}
      >
        {header}
        {suggestionsSection}
        {messagesSection}
        {inputSection}
      </div>
    );
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setIsExpanded(false);
            }}
            className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 shadow-2xl shadow-violet-500/40 transition-all hover:shadow-violet-500/60"
            aria-label="Open chat"
          >
            <MessageCircle className="h-7 w-7 text-white" />
            <motion.div
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-slate-950 bg-red-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                !
              </span>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex max-h-[calc(100vh-3rem)] flex-col rounded-3xl border border-violet-400/40 bg-slate-950/95 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl transition-all duration-300",
              isExpanded
                ? "inset-6 max-h-[calc(100vh-3rem)] w-[min(720px,calc(100vw-3rem))]"
                : "bottom-6 right-6 h-[640px] w-[460px]",
            )}
          >
            {header}
            {suggestionsSection}
            {messagesSection}
            {inputSection}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
