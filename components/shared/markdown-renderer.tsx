"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    <div className="group/code relative my-4 overflow-hidden rounded-xl border border-foreground/[0.08] bg-black/40">
      <div className="flex items-center justify-between border-b border-foreground/[0.06] bg-black/60 px-3 py-1.5 backdrop-blur-md">
        <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
          {lang || "Code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-foreground/30 transition-colors hover:text-foreground/80"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-neon-green" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="!m-0 !bg-transparent !p-0">
          <code className="font-mono text-xs leading-relaxed text-foreground/80">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-invert max-w-none",
        "prose-p:leading-relaxed prose-p:text-[13px] prose-p:text-foreground/85 md:prose-p:text-sm",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground/95",
        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm",
        "prose-a:text-neon-cyan prose-a:no-underline hover:prose-a:underline",
        "prose-strong:font-semibold prose-strong:text-foreground/95",
        "prose-ul:text-[13px] md:prose-ul:text-sm prose-ul:text-foreground/85 prose-ul:my-2",
        "prose-ol:text-[13px] md:prose-ol:text-sm prose-ol:text-foreground/85 prose-ol:my-2",
        "prose-li:my-0.5",
        "prose-table:text-[13px] md:prose-table:text-sm",
        "prose-th:border-foreground/[0.06] prose-th:bg-foreground/[0.03] prose-th:px-3 prose-th:py-2",
        "prose-td:border-foreground/[0.06] prose-td:px-3 prose-td:py-2 text-foreground/85",
        "prose-blockquote:border-l-2 prose-blockquote:border-neon-cyan/50 prose-blockquote:bg-neon-cyan/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-foreground/75 prose-blockquote:not-italic",
        "prose-hr:border-foreground/[0.08] prose-hr:my-4",
        "prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: any) {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : undefined;
            const isBlock = Boolean(match);

            if (isBlock) {
              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, "")}
                  lang={lang}
                />
              );
            }

            return (
              <code
                className={cn(
                  "rounded-md bg-neon-cyan/10 px-1.5 py-0.5 font-mono text-[11.5px] text-neon-cyan/90 before:content-none after:content-none",
                  className
                )}
                {...rest}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
