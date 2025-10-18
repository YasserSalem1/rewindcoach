"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/ui";

const prismTheme = oneDark as Record<string, CSSProperties>;

interface ChatMessageProps {
  role: "user" | "coach";
  content: string;
  isStreaming?: boolean;
}

type MarkdownCodeProps = HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
};

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isCoach = role === "coach";

  const markdownComponents: Components = {
    code({ inline, className, children, ...props }: MarkdownCodeProps) {
      const match = /language-(\w+)/.exec(className ?? "");

      if (!inline && match) {
        return (
          <SyntaxHighlighter
            style={prismTheme}
            language={match[1]}
            PreTag="div"
            className="rounded-lg !bg-slate-900/80 !mt-2 !mb-2"
            {...props}
          >
            {String(children ?? "").replace(/\n$/, "")}
          </SyntaxHighlighter>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <h1 className="text-lg font-bold mb-2 mt-3 text-violet-100">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-base font-semibold mb-2 mt-2 text-violet-200">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-semibold mb-1 mt-2 text-violet-200">{children}</h3>
    ),
    p: ({ children }) => <p className="text-sm leading-relaxed my-2">{children}</p>,
    ul: ({ children }) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-sm">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-300 hover:text-violet-200 hover:underline transition-colors"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-violet-400/50 pl-4 my-2 italic text-violet-200/80">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full text-sm border border-white/10">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-violet-500/20 p-2 border border-white/10 font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="p-2 border border-white/10">{children}</td>
    ),
  };

  return (
    <div
      className={cn(
        "group max-w-[90%] rounded-2xl px-4 py-3",
        isCoach
          ? "bg-gradient-to-br from-violet-500/15 to-purple-500/10 text-violet-50"
          : "ml-auto bg-gradient-to-br from-white/10 to-white/5 text-slate-100",
      )}
    >
      <div
        className={cn(
          "prose prose-sm prose-invert max-w-none",
          "prose-headings:font-semibold prose-headings:text-violet-200",
          "prose-p:text-sm prose-p:leading-relaxed prose-p:my-2",
          "prose-a:text-violet-300 prose-a:no-underline hover:prose-a:text-violet-200 hover:prose-a:underline",
          "prose-strong:text-violet-100 prose-strong:font-semibold",
          "prose-code:text-violet-200 prose-code:bg-violet-950/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-lg",
          "prose-ul:my-2 prose-ul:list-disc prose-ul:ml-4",
          "prose-ol:my-2 prose-ol:list-decimal prose-ol:ml-4",
          "prose-li:text-sm prose-li:my-1",
          "prose-blockquote:border-l-4 prose-blockquote:border-violet-400/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-violet-200/80",
          "prose-hr:border-white/10",
          "prose-table:text-sm prose-table:border prose-table:border-white/10",
          "prose-th:bg-violet-500/20 prose-th:p-2 prose-th:border prose-th:border-white/10",
          "prose-td:p-2 prose-td:border prose-td:border-white/10",
          isStreaming && "animate-pulse-subtle",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
