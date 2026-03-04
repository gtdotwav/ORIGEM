"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
  toast.success("Copiado!");
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/code relative my-2 rounded-xl border border-white/[0.08] bg-black/40">
      {lang && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
          <span className="text-[10px] text-white/30">{lang}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-white/25 transition-colors hover:text-white/50"
          >
            {copied ? (
              <Check className="h-3 w-3 text-neon-green" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-3 py-2.5">
        <code className="font-mono text-xs text-white/80">{code}</code>
      </pre>
      {!lang && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/code:opacity-100 text-white/25 hover:text-white/50"
        >
          {copied ? (
            <Check className="h-3 w-3 text-neon-green" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      nodes.push(<strong key={key++} className="font-semibold text-white/95">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      nodes.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Code span
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push(
        <code
          key={key++}
          className="rounded-md bg-neon-cyan/10 px-1.5 py-0.5 font-mono text-xs text-neon-cyan/90"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Regular text — consume until next special char
    const nextSpecial = remaining.search(/[*`]/);
    if (nextSpecial === -1) {
      nodes.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Special char that didn't match patterns — treat as text
      nodes.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      nodes.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return nodes;
}

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const elements: React.ReactNode[] = [];
  let key = 0;

  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  for (const part of parts) {
    // Code block
    const codeBlockMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (codeBlockMatch) {
      elements.push(
        <CodeBlock key={key++} lang={codeBlockMatch[1] || undefined} code={codeBlockMatch[2].trimEnd()} />
      );
      continue;
    }

    // Process lines for non-code-block content
    const lines = part.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (line.trim() === "") {
        i++;
        continue;
      }

      // Bullet list
      if (/^[-*]\s/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*]\s/, ""));
          i++;
        }
        elements.push(
          <ul key={key++} className="my-1 ml-4 list-disc space-y-0.5">
            {items.map((item, j) => (
              <li key={j} className="text-sm leading-relaxed text-white/85">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list
      if (/^\d+[.)]\s/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+[.)]\s/, ""));
          i++;
        }
        elements.push(
          <ol key={key++} className="my-1 ml-4 list-decimal space-y-0.5">
            {items.map((item, j) => (
              <li key={j} className="text-sm leading-relaxed text-white/85">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={key++} className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderInlineMarkdown(line)}
        </p>
      );
      i++;
    }
  }

  return <div className={cn("space-y-1", className)}>{elements}</div>;
}
