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
        "prose-p:leading-relaxed prose-p:text-[14px] md:prose-p:text-[15px] prose-p:text-foreground/90 prose-p:mb-4",
        "prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-h1:text-[22px] prose-h1:mb-5 prose-h1:mt-8 prose-h2:text-[18px] prose-h2:mb-4 prose-h2:mt-6 prose-h3:text-[16px] prose-h4:text-[15px]",
        "prose-a:text-neon-cyan prose-a:no-underline hover:prose-a:underline hover:prose-a:text-neon-cyan/80 prose-a:transition-colors",
        "prose-strong:font-semibold prose-strong:text-white",
        "prose-ul:text-[14px] md:prose-ul:text-[15px] prose-ul:text-foreground/90 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5 marker:text-foreground/40",
        "prose-ol:text-[14px] md:prose-ol:text-[15px] prose-ol:text-foreground/90 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5 marker:text-foreground/40",
        "prose-li:my-1.5 prose-li:pl-1",
        "prose-table:text-[14px] md:prose-table:text-[15px] prose-table:my-6 prose-table:overflow-hidden prose-table:rounded-xl prose-table:border prose-table:border-foreground/[0.08]",
        "prose-th:border-b prose-th:border-foreground/[0.08] prose-th:bg-foreground/[0.03] prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-medium",
        "prose-td:border-b prose-td:border-foreground/[0.04] prose-td:px-4 prose-td:py-3 text-foreground/80 last:prose-td:border-0",
        "prose-blockquote:border-l-[3px] prose-blockquote:border-neon-cyan/40 prose-blockquote:bg-gradient-to-r prose-blockquote:from-neon-cyan/[0.05] prose-blockquote:to-transparent prose-blockquote:py-2.5 prose-blockquote:px-5 prose-blockquote:text-foreground/80 prose-blockquote:not-italic prose-blockquote:rounded-r-xl prose-blockquote:my-5",
        "prose-hr:border-foreground/[0.08] prose-hr:my-8",
        "prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0",
        "animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out fill-mode-both",
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
