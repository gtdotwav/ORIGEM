"use client";

import { useState, useCallback } from "react";
import {
  Code2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  WrapText,
  FileCode,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileTree, type FileNode } from "@/components/ui/file-tree";

/* ─── Demo project structure ─── */
const DEMO_FILES: FileNode[] = [
  {
    name: "app",
    type: "folder",
    children: [
      {
        name: "layout.tsx",
        type: "file",
        extension: "tsx",
        content: `import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "ORIGEM — Psychosemantic AI Engine",
  description: "Decompose language into atomic meaning.",
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`,
      },
      {
        name: "page.tsx",
        type: "file",
        extension: "tsx",
        content: `"use client"

import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg"
import { FloatingNav } from "@/components/layout/floating-nav"

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen bg-[#04070d] text-white">
      <LiquidGradientBackground />
      <FloatingNav />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Dashboard content */}
      </div>
    </main>
  )
}`,
      },
      { name: "globals.css", type: "file", extension: "css", content: `@import "tailwindcss";\n@import "tw-animate-css";\n\n@custom-variant dark (&:is(.dark *));\n\n:root {\n  --background: oklch(0.98 0 0);\n  --foreground: oklch(0.12 0 0);\n}\n\n.dark {\n  --background: oklch(0.06 0 0);\n  --foreground: oklch(0.95 0 0);\n}` },
    ],
  },
  {
    name: "components",
    type: "folder",
    children: [
      {
        name: "ui",
        type: "folder",
        children: [
          { name: "button.tsx", type: "file", extension: "tsx", content: `import { cn } from "@/lib/utils"\nimport { Slot } from "@radix-ui/react-slot"\nimport { forwardRef } from "react"\n\nexport interface ButtonProps\n  extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: "default" | "outline" | "ghost"\n  size?: "default" | "sm" | "lg"\n  asChild?: boolean\n}\n\nconst Button = forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant = "default", size = "default", asChild, ...props }, ref) => {\n    const Comp = asChild ? Slot : "button"\n    return (\n      <Comp\n        className={cn("inline-flex items-center justify-center rounded-md", className)}\n        ref={ref}\n        {...props}\n      />\n    )\n  }\n)\nButton.displayName = "Button"\n\nexport { Button }` },
          { name: "card.tsx", type: "file", extension: "tsx", content: `import { cn } from "@/lib/utils"\n\nexport function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {\n  return (\n    <div\n      className={cn("rounded-xl border bg-card text-card-foreground", className)}\n      {...props}\n    />\n  )\n}` },
          { name: "input.tsx", type: "file", extension: "tsx", content: `import { cn } from "@/lib/utils"\nimport { forwardRef } from "react"\n\nconst Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(\n  ({ className, type, ...props }, ref) => (\n    <input\n      type={type}\n      className={cn(\n        "h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm",\n        className\n      )}\n      ref={ref}\n      {...props}\n    />\n  )\n)\nInput.displayName = "Input"\n\nexport { Input }` },
          { name: "file-tree.tsx", type: "file", extension: "tsx", content: `// FileTree component — see components/ui/file-tree.tsx` },
        ],
      },
      {
        name: "shared",
        type: "folder",
        children: [
          { name: "liquid-gradient-bg.tsx", type: "file", extension: "tsx", content: `// Three.js liquid gradient background shader` },
          { name: "glass-card.tsx", type: "file", extension: "tsx", content: `// Glassmorphism card wrapper` },
          { name: "markdown-renderer.tsx", type: "file", extension: "tsx", content: `// Markdown rendering with code blocks` },
        ],
      },
    ],
  },
  {
    name: "lib",
    type: "folder",
    children: [
      { name: "utils.ts", type: "file", extension: "ts", content: `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}` },
      { name: "auth.ts", type: "file", extension: "ts", content: `import NextAuth from "next-auth"\nimport GitHub from "next-auth/providers/github"\n\nexport const { handlers, auth, signIn, signOut } = NextAuth({\n  providers: [GitHub],\n  pages: { signIn: "/login" },\n})` },
    ],
  },
  {
    name: "stores",
    type: "folder",
    children: [
      { name: "session-store.ts", type: "file", extension: "ts", content: `import { create } from "zustand"\nimport { persist } from "zustand/middleware"\n\n// Session state management with localStorage persistence` },
      { name: "agent-store.ts", type: "file", extension: "ts", content: `import { create } from "zustand"\nimport { persist } from "zustand/middleware"\n\n// Agent state management` },
    ],
  },
  { name: "package.json", type: "file", extension: "json", content: `{\n  "name": "origem",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev --turbopack",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "16.1.6",\n    "react": "19.2.0",\n    "zustand": "5.0.11",\n    "three": "0.175.0"\n  }\n}` },
  { name: "tsconfig.json", type: "file", extension: "json", content: `{\n  "compilerOptions": {\n    "target": "ES2017",\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "jsx": "preserve",\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "paths": { "@/*": ["./*"] },\n    "strict": true\n  }\n}` },
];

export default function CodeAppPage() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleFileSelect = useCallback((node: FileNode) => {
    setSelectedFile(node);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!selectedFile?.content) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedFile]);

  const lines = selectedFile?.content?.split("\n") ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
            <Code2 className="h-5 w-5 text-neon-green" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Code</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore e acompanhe arquivos do seu projeto em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-neon-green/20 bg-neon-green/10 px-3 py-1">
            <Circle className="h-2 w-2 fill-neon-green text-neon-green" />
            <span className="text-[10px] font-medium text-neon-green">
              Conectado
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 overflow-hidden rounded-2xl border border-border/50 bg-card">
        {/* Sidebar toggle (mobile) */}
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:text-foreground sm:hidden"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        {/* File tree sidebar */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-border/30 transition-all duration-300 ease-out overflow-hidden",
            sidebarOpen ? "w-[280px]" : "w-0 border-r-0",
            "max-sm:absolute max-sm:left-0 max-sm:top-0 max-sm:z-20 max-sm:h-full max-sm:bg-card max-sm:shadow-xl",
          )}
        >
          <div className="h-full w-[280px] overflow-y-auto">
            <FileTree
              data={DEMO_FILES}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile?.name ?? null}
              className="rounded-none border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Code viewer */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">
                    {selectedFile.name}
                  </span>
                  {selectedFile.extension && (
                    <span className="rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {selectedFile.extension}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Sidebar toggle (desktop) */}
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="hidden items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:flex"
                    title={sidebarOpen ? "Esconder explorador" : "Mostrar explorador"}
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    ) : (
                      <PanelLeftOpen className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordWrap((v) => !v)}
                    className={cn(
                      "flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-muted/50",
                      wordWrap
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Quebra de linha"
                  >
                    <WrapText className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    title="Copiar"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-neon-green" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[11px]">
                      {copied ? "Copiado" : "Copiar"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto">
                <div className="min-h-full p-4">
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line, i) => (
                        <tr key={i} className="group hover:bg-foreground/[0.02]">
                          <td className="select-none pr-4 text-right align-top font-mono text-xs text-muted-foreground/50 group-hover:text-muted-foreground">
                            {i + 1}
                          </td>
                          <td
                            className={cn(
                              "font-mono text-xs text-foreground/80",
                              wordWrap
                                ? "whitespace-pre-wrap break-all"
                                : "whitespace-pre"
                            )}
                          >
                            {line || "\u00A0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between border-t border-border/30 px-4 py-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {lines.length} linhas
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {selectedFile.extension?.toUpperCase() ?? "TXT"}
                </span>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                <FileCode className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione um arquivo para visualizar
              </p>
              <p className="text-xs text-muted-foreground/50">
                Navegue pela arvore de arquivos a esquerda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
