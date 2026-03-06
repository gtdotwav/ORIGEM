"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  WrapText,
  FileCode,
  Circle,
  Send,
  Play,
  Eye,
  Sparkles,
  Upload,
  Bot,
  User,
  Loader2,
  ExternalLink,
  RotateCcw,
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

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold">ORIGEM</h1>
      <p className="mt-4 text-lg text-white/60">
        Psychosemantic AI Engine
      </p>
      <button className="mt-8 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur-xl transition hover:bg-white/20">
        Comecar
      </button>
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
        ],
      },
    ],
  },
  {
    name: "lib",
    type: "folder",
    children: [
      { name: "utils.ts", type: "file", extension: "ts", content: `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}` },
    ],
  },
  { name: "package.json", type: "file", extension: "json", content: `{\n  "name": "origem",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev --turbopack",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "16.1.6",\n    "react": "19.2.0",\n    "zustand": "5.0.11",\n    "three": "0.175.0"\n  }\n}` },
  { name: "tsconfig.json", type: "file", extension: "json", content: `{\n  "compilerOptions": {\n    "target": "ES2017",\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "jsx": "preserve",\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "paths": { "@/*": ["./*"] },\n    "strict": true\n  }\n}` },
];

/* ─── Chat message type ─── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/* ─── Build HTML preview from project files ─── */
function buildPreviewHtml(files: FileNode[]): string {
  const findFile = (nodes: FileNode[], name: string): FileNode | null => {
    for (const n of nodes) {
      if (n.name === name) return n;
      if (n.children) {
        const found = findFile(n.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const page = findFile(files, "page.tsx");
  const css = findFile(files, "globals.css");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Preview</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  ${css?.content?.replace(/@import[^;]+;/g, "").replace(/@custom-variant[^;]+;/g, "") ?? ""}
</style>
</head>
<body class="dark bg-black text-white">
<div id="root">
  <main class="flex min-h-screen flex-col items-center justify-center bg-black text-white">
    <h1 class="text-4xl font-bold">ORIGEM</h1>
    <p class="mt-4 text-lg text-white/60">Psychosemantic AI Engine</p>
    <button class="mt-8 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur-xl transition hover:bg-white/20">Comecar</button>
  </main>
</div>
</body>
</html>`;
}

/* ─── Right panel tab ─── */
type RightTab = "chat" | "preview";

export default function CodeIDEPage() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("chat");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ola! Sou seu assistente de codigo. Posso ajudar a criar, editar e entender seu projeto. O que deseja fazer?",
      timestamp: Date.now(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || isSending) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsSending(true);

    // Simulated AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: getSimulatedResponse(userMsg.content, selectedFile),
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setIsSending(false);
    }, 1200);
  }, [chatInput, isSending, selectedFile]);

  const lines = selectedFile?.content?.split("\n") ?? [];
  const previewHtml = buildPreviewHtml(DEMO_FILES);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[oklch(0.08_0_0)]">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.05] bg-[oklch(0.07_0_0)] px-3">
        <div className="flex items-center gap-2.5">
          <a
            href="/dashboard"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
          >
            <Code2 className="h-3.5 w-3.5" />
          </a>
          <span className="text-[11px] font-medium text-white/40">ORIGEM Code</span>
          <div className="flex items-center gap-1.5 rounded-full border border-neon-green/20 bg-neon-green/8 px-2 py-0.5">
            <Circle className="h-1.5 w-1.5 fill-neon-green text-neon-green" />
            <span className="text-[9px] font-medium text-neon-green/80">Live</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            title="Explorador"
          >
            {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setRightPanelOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            title="Chat & Preview"
          >
            {rightPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-white/[0.05] bg-[oklch(0.07_0_0)] transition-all duration-200 overflow-hidden",
            sidebarOpen ? "w-[240px]" : "w-0 border-r-0"
          )}
        >
          <div className="flex h-8 items-center border-b border-white/[0.04] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Explorer</span>
            <button
              type="button"
              className="ml-auto flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              title="Upload"
            >
              <Upload className="h-3 w-3" />
            </button>
          </div>
          <div className="h-[calc(100%-2rem)] w-[240px] overflow-y-auto">
            <FileTree
              data={DEMO_FILES}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile?.name ?? null}
              className="rounded-none border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Editor area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File tabs */}
              <div className="flex h-8 items-center gap-px border-b border-white/[0.05] bg-[oklch(0.075_0_0)]">
                <div className="flex h-full items-center gap-2 border-b-2 border-neon-cyan/40 bg-white/[0.03] px-3">
                  <FileCode className="h-3 w-3 text-white/35" />
                  <span className="text-[11px] font-medium text-white/70">{selectedFile.name}</span>
                </div>
                <div className="ml-auto flex items-center gap-0.5 px-2">
                  <button
                    type="button"
                    onClick={() => setWordWrap((v) => !v)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06]",
                      wordWrap && "text-white/50"
                    )}
                    title="Word wrap"
                  >
                    <WrapText className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
                    title="Copiar"
                  >
                    {copied ? <Check className="h-3 w-3 text-neon-green" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto bg-[oklch(0.08_0_0)]">
                <div className="min-h-full p-4">
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line, i) => (
                        <tr key={i} className="group hover:bg-white/[0.015]">
                          <td className="select-none pr-4 text-right align-top font-mono text-[11px] leading-5 text-white/15 group-hover:text-white/25" style={{ width: 40 }}>
                            {i + 1}
                          </td>
                          <td
                            className={cn(
                              "font-mono text-[12px] leading-5 text-white/75",
                              wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
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
              <div className="flex h-6 items-center justify-between border-t border-white/[0.05] bg-[oklch(0.07_0_0)] px-3">
                <span className="text-[10px] text-white/20">{lines.length} linhas</span>
                <span className="font-mono text-[10px] text-white/20">{selectedFile.extension?.toUpperCase() ?? "TXT"}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <FileCode className="h-6 w-6 text-white/12" />
              </div>
              <p className="text-xs text-white/25">Selecione um arquivo para editar</p>
            </div>
          )}
        </div>

        {/* Right panel — Chat + Preview */}
        {rightPanelOpen && (
          <div className="flex w-[360px] flex-shrink-0 flex-col border-l border-white/[0.05] bg-[oklch(0.07_0_0)]">
            {/* Tabs */}
            <div className="flex h-8 items-center border-b border-white/[0.05]">
              <button
                type="button"
                onClick={() => setRightTab("chat")}
                className={cn(
                  "flex h-full flex-1 items-center justify-center gap-1.5 text-[11px] font-medium transition-colors",
                  rightTab === "chat"
                    ? "border-b-2 border-neon-cyan/40 text-white/70"
                    : "text-white/25 hover:text-white/45"
                )}
              >
                <Sparkles className="h-3 w-3" />
                Chat IA
              </button>
              <button
                type="button"
                onClick={() => setRightTab("preview")}
                className={cn(
                  "flex h-full flex-1 items-center justify-center gap-1.5 text-[11px] font-medium transition-colors",
                  rightTab === "preview"
                    ? "border-b-2 border-neon-green/40 text-white/70"
                    : "text-white/25 hover:text-white/45"
                )}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>

            {/* Chat tab */}
            {rightTab === "chat" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
                      <div className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                        msg.role === "assistant" ? "bg-neon-cyan/10" : "bg-white/[0.06]"
                      )}>
                        {msg.role === "assistant" ? (
                          <Bot className="h-3 w-3 text-neon-cyan/70" />
                        ) : (
                          <User className="h-3 w-3 text-white/40" />
                        )}
                      </div>
                      <div className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2",
                        msg.role === "assistant"
                          ? "bg-white/[0.04] text-white/65"
                          : "bg-neon-cyan/[0.08] text-white/75"
                      )}>
                        <p className="text-[12px] leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10">
                        <Loader2 className="h-3 w-3 animate-spin text-neon-cyan/70" />
                      </div>
                      <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                        <p className="text-[12px] text-white/30">Pensando...</p>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/[0.05] p-2.5">
                  <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                      placeholder="Peca uma mudanca no codigo..."
                      className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/18 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isSending}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-neon-cyan/12 text-neon-cyan/70 transition-all hover:bg-neon-cyan/20 disabled:opacity-20"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-center text-[9px] text-white/15">
                    IA pode editar arquivos em tempo real
                  </p>
                </div>
              </div>
            )}

            {/* Preview tab */}
            {rightTab === "preview" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Preview toolbar */}
                <div className="flex h-8 items-center justify-between border-b border-white/[0.04] px-3">
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-1.5 w-1.5 fill-neon-green text-neon-green" />
                    <span className="text-[10px] text-white/30">localhost:3000</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
                      title="Recarregar"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* iframe preview */}
                <div className="flex-1 bg-black">
                  <iframe
                    key={previewKey}
                    srcDoc={previewHtml}
                    title="Preview"
                    className="h-full w-full border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Simulated AI responses ─── */
function getSimulatedResponse(input: string, file: FileNode | null): string {
  const lower = input.toLowerCase();
  if (lower.includes("cor") || lower.includes("color") || lower.includes("tema"))
    return "Posso alterar as cores do projeto. Quais cores deseja? Posso modificar o globals.css e os componentes que usam essas cores.";
  if (lower.includes("botao") || lower.includes("button"))
    return "Vou melhorar o componente Button. Posso adicionar variantes (primary, secondary, ghost), animacoes de hover e estados de loading. Quer que eu faca isso?";
  if (lower.includes("page") || lower.includes("pagina") || lower.includes("home"))
    return `Posso editar o page.tsx${file ? ` (voce esta vendo ${file.name})` : ""}. O que deseja mudar na pagina principal?`;
  if (lower.includes("preview") || lower.includes("ver"))
    return "Clique na aba 'Preview' para ver o resultado em tempo real. Cada alteracao que eu fizer vai atualizar automaticamente.";
  if (lower.includes("criar") || lower.includes("novo") || lower.includes("adicionar"))
    return "Claro! Posso criar novos componentes, paginas ou utilitarios. Descreva o que precisa e eu gero o codigo.";
  if (lower.includes("explicar") || lower.includes("como funciona"))
    return file
      ? `O arquivo ${file.name} ${file.extension === "tsx" ? "e um componente React com TypeScript" : file.extension === "css" ? "define os estilos globais do projeto" : "faz parte da configuracao do projeto"}. Quer que eu explique alguma parte especifica?`
      : "Selecione um arquivo na arvore e posso explicar qualquer parte do codigo.";
  return "Entendi! Posso ajudar com isso. Descreva com mais detalhes o que deseja e vou gerar ou modificar o codigo necessario.";
}
