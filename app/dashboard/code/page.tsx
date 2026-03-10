"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  Eye,
  Blocks,
  Bot,
  User,
  RotateCcw,
  Square,
  Terminal,
  Plus,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { callChatStream } from "@/lib/chat-api";
import { WorkActivityCard } from "@/components/code/work-activity-card";
import { FileTree, type FileNode } from "@/components/ui/file-tree";

/* ─── Chat message type ─── */
type ActivityStepState = "pending" | "active" | "done";

interface ActivityStep {
  id: string;
  label: string;
  state: ActivityStepState;
}

interface FileChangeSummary {
  path: string;
  status: "created" | "updated";
  addedLines: number;
  removedLines: number;
}

interface MessageWorkActivity {
  summary: string;
  status: "streaming" | "complete" | "error";
  startedAt: number;
  finishedAt?: number;
  steps: ActivityStep[];
  reads: string[];
  searches: string[];
  changes: FileChangeSummary[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  activity?: MessageWorkActivity;
}

interface ParsedWorklog {
  summary: string;
  steps: string[];
  reads: string[];
  searches: string[];
}

const WORKLOG_REGEX = /<origem-worklog>\s*([\s\S]*?)\s*<\/origem-worklog>/i;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeWorklogList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(
    value.filter((item): item is string => typeof item === "string")
  ).slice(0, 8);
}

function extractWorklog(text: string): ParsedWorklog | null {
  const match = text.match(WORKLOG_REGEX);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[1]) as {
      summary?: unknown;
      steps?: unknown;
      reads?: unknown;
      searches?: unknown;
    };

    return {
      summary:
        typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      steps: normalizeWorklogList(parsed.steps),
      reads: normalizeWorklogList(parsed.reads),
      searches: normalizeWorklogList(parsed.searches),
    };
  } catch {
    return null;
  }
}

function stripWorklogBlock(text: string): string {
  return text.replace(WORKLOG_REGEX, "").trim();
}

function getChatSurfaceText(text: string): string {
  const withoutWorklog = stripWorklogBlock(text);
  const firstFence = withoutWorklog.indexOf("```");

  if (firstFence === -1) {
    return withoutWorklog.trim();
  }

  const prefix = withoutWorklog.slice(0, firstFence).trim();
  return prefix
    ? `${prefix}\n\n[Codigo gerado - veja no editor]`
    : "[Codigo gerado - veja no editor]";
}

function createFileNode(path: string, content: string): FileNode {
  const name = path.split("/").pop() ?? path;
  const extension = name.split(".").pop() ?? "";

  return {
    name,
    path,
    type: "file",
    extension,
    content,
  };
}

function buildPendingActivity(existingPaths: string[]): MessageWorkActivity {
  const hasExistingFiles = existingPaths.length > 0;
  const stepLabels = hasExistingFiles
    ? [
        "Lendo o estado atual do projeto",
        "Mapeando as alteracoes pedidas",
        "Gerando arquivos revisados",
        "Atualizando editor e preview",
      ]
    : [
        "Planejando a estrutura inicial",
        "Gerando os arquivos base",
        "Organizando o projeto",
        "Atualizando editor e preview",
      ];

  return {
    summary: hasExistingFiles
      ? "Analisando o projeto atual e preparando as alteracoes."
      : "Montando a primeira versao do projeto.",
    status: "streaming",
    startedAt: Date.now(),
    steps: stepLabels.map((label, index) => ({
      id: `${index}-${label}`,
      label,
      state: index === 0 ? "active" : "pending",
    })),
    reads: existingPaths.slice(0, 4),
    searches: [],
    changes: [],
  };
}

function advanceActivitySteps(
  steps: ActivityStep[],
  activeIndex: number
): ActivityStep[] {
  return steps.map((step, index) => ({
    ...step,
    state:
      index < activeIndex
        ? "done"
        : index === activeIndex
          ? "active"
          : "pending",
  }));
}

function computeLineDelta(previousContent: string | undefined, nextContent: string) {
  const nextLines = nextContent.split("\n");
  if (previousContent == null) {
    return { addedLines: nextLines.length, removedLines: 0 };
  }

  const previousLines = previousContent.split("\n");
  let start = 0;

  while (
    start < previousLines.length &&
    start < nextLines.length &&
    previousLines[start] === nextLines[start]
  ) {
    start += 1;
  }

  let previousEnd = previousLines.length - 1;
  let nextEnd = nextLines.length - 1;

  while (
    previousEnd >= start &&
    nextEnd >= start &&
    previousLines[previousEnd] === nextLines[nextEnd]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  return {
    addedLines: Math.max(0, nextEnd - start + 1),
    removedLines: Math.max(0, previousEnd - start + 1),
  };
}

function summarizeFileChanges(
  previousFiles: Map<string, string>,
  blocks: { filename: string; content: string }[]
): FileChangeSummary[] {
  return blocks.map(({ filename, content }) => {
    const previousContent = previousFiles.get(filename);
    const delta = computeLineDelta(previousContent, content);

    return {
      path: filename,
      status: previousContent == null ? "created" : "updated",
      addedLines: delta.addedLines,
      removedLines: delta.removedLines,
    };
  });
}

function buildCompletedActivity(
  pendingActivity: MessageWorkActivity,
  worklog: ParsedWorklog | null,
  changes: FileChangeSummary[]
): MessageWorkActivity {
  const fallbackReads =
    pendingActivity.reads.length > 0
      ? pendingActivity.reads
      : changes.map((change) => change.path).slice(0, 4);
  const nextSteps =
    worklog?.steps.length && worklog.steps.length > 0
      ? worklog.steps
      : pendingActivity.steps.map((step) => step.label);

  return {
    summary:
      worklog?.summary ||
      (changes.length > 0
        ? "Conclui as alteracoes e sincronizei os arquivos gerados."
        : pendingActivity.summary),
    status: "complete",
    startedAt: pendingActivity.startedAt,
    finishedAt: Date.now(),
    steps: nextSteps.map((label, index) => ({
      id: `${index}-${label}`,
      label,
      state: "done",
    })),
    reads:
      worklog?.reads.length && worklog.reads.length > 0
        ? worklog.reads
        : fallbackReads,
    searches: worklog?.searches ?? [],
    changes,
  };
}

/* ─── Parse code blocks from AI response ─── */
function parseCodeBlocks(text: string): { filename: string; content: string }[] {
  const blocks: { filename: string; content: string }[] = [];
  // Match ```filename\n...``` or ```lang:filename\n...```
  const regex = /```(?:(\w+):)?([^\n`]+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const lang = match[1] ?? "";
    const filename = (match[2] ?? "").trim();
    const code = match[3] ?? "";
    if (filename && code.trim()) {
      blocks.push({ filename, content: code.trim() });
    } else if (code.trim() && lang) {
      // Infer filename from language
      const ext = lang === "typescript" || lang === "tsx" ? "tsx" : lang === "javascript" || lang === "jsx" ? "jsx" : lang === "css" ? "css" : lang === "html" ? "html" : lang;
      blocks.push({ filename: `code.${ext}`, content: code.trim() });
    }
  }
  return blocks;
}

/* ─── Build file tree from flat file list ─── */
function buildFileTree(files: Map<string, string>): FileNode[] {
  const root: FileNode[] = [];
  const dirs = new Map<string, FileNode>();

  for (const [path, content] of files) {
    const parts = path.split("/");
    parts.pop();

    let parent = root;
    let currentPath = "";

    for (const dir of parts) {
      currentPath += (currentPath ? "/" : "") + dir;
      if (!dirs.has(currentPath)) {
        const dirNode: FileNode = {
          name: dir,
          path: currentPath,
          type: "folder",
          children: [],
        };
        parent.push(dirNode);
        dirs.set(currentPath, dirNode);
      }
      parent = dirs.get(currentPath)!.children!;
    }

    parent.push(createFileNode(path, content));
  }

  return root;
}

/* ─── Build preview HTML from files ─── */
function buildPreviewHtml(files: Map<string, string>, currentFile: FileNode | null): string {
  // Check if we have an HTML file
  const htmlFile = files.get("index.html") ?? files.get("page.html");
  const cssFile = files.get("styles.css") ?? files.get("style.css") ?? files.get("globals.css") ?? "";

  if (htmlFile) {
    // Inject CSS if separate
    if (cssFile) {
      return htmlFile.replace("</head>", `<style>${cssFile}</style></head>`);
    }
    return htmlFile;
  }

  // For TSX/JSX files, show code as preview
  const content = currentFile?.content ?? "";
  const ext = currentFile?.extension ?? "";
  const isTsx = ext === "tsx" || ext === "jsx";

  if (isTsx) {
    const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*\}?\s*$/m);
    const bodyContent = returnMatch
      ? returnMatch[1].replace(/className=/g, "class=").replace(/\{[^}]*\}/g, "")
      : "";
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;font-family:system-ui;background:#000;color:#fff}</style></head><body class="dark bg-black text-white">${bodyContent || '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#444">Preview</div>'}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{margin:0;background:#000;color:#888;font-family:monospace;padding:20px;font-size:12px;white-space:pre-wrap}</style></head><body>${content.replace(/</g, "&lt;") || "Selecione um arquivo para preview"}</body></html>`;
}

/* ─── Ext color helper ─── */
function getExtColor(ext?: string): string {
  switch (ext) {
    case "tsx": case "ts": return "text-neon-cyan/70";
    case "jsx": case "js": return "text-yellow-400/70";
    case "css": return "text-neon-purple/70";
    case "html": return "text-orange-400/70";
    case "json": return "text-neon-orange/70";
    default: return "text-white/40";
  }
}

/* ─── Right panel tab ─── */
type RightTab = "chat" | "preview";

export default function CodeIDEPage() {
  const router = useRouter();
  const [files, setFiles] = useState<Map<string, string>>(new Map());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
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
      content: "Ola! Descreva o que deseja criar e vou gerar os arquivos do projeto. Por exemplo:\n\n• \"Crie uma landing page moderna com hero, features e footer\"\n• \"Crie um dashboard com sidebar e cards de metricas\"\n• \"Crie um formulario de contato com validacao\"",
      timestamp: Date.now(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamContentRef = useRef("");
  const streamFrameRef = useRef<number | null>(null);
  const progressTimeoutsRef = useRef<number[]>([]);
  const [previewKey, setPreviewKey] = useState(0);

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) {
      return;
    }

    composer.style.height = "0px";
    composer.style.height = `${Math.min(composer.scrollHeight, 164)}px`;
  }, [chatInput]);

  const clearProgressTimers = useCallback(() => {
    progressTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    progressTimeoutsRef.current = [];

    if (streamFrameRef.current != null) {
      window.cancelAnimationFrame(streamFrameRef.current);
      streamFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearProgressTimers();
      abortControllerRef.current?.abort();
    };
  }, [clearProgressTimers]);

  const patchMessage = useCallback(
    (messageId: string, updater: (message: ChatMessage) => ChatMessage) => {
      setChatMessages((messages) =>
        messages.map((message) =>
          message.id === messageId ? updater(message) : message
        )
      );
    },
    []
  );

  const scheduleProgressSteps = useCallback(
    (messageId: string) => {
      clearProgressTimers();

      [900, 2200, 3800].forEach((delay, index) => {
        const timeoutId = window.setTimeout(() => {
          patchMessage(messageId, (message) => {
            if (!message.activity || message.activity.status !== "streaming") {
              return message;
            }

            return {
              ...message,
              activity: {
                ...message.activity,
                steps: advanceActivitySteps(message.activity.steps, Math.min(index + 1, message.activity.steps.length - 1)),
              },
            };
          });
        }, delay);

        progressTimeoutsRef.current.push(timeoutId);
      });
    },
    [clearProgressTimers, patchMessage]
  );

  const handleFileSelect = useCallback((node: FileNode) => {
    setSelectedFile(node);
    setCopied(false);
    setOpenTabs((tabs) => {
      if (tabs.some((tab) => (tab.path ?? tab.name) === (node.path ?? node.name))) {
        return tabs;
      }
      return [...tabs, node];
    });
  }, []);

  const handleCloseTab = useCallback((tabPath: string) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((tab) => (tab.path ?? tab.name) !== tabPath);
      if ((selectedFile?.path ?? selectedFile?.name) === tabPath) {
        setSelectedFile(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [selectedFile]);

  const selectFileByPath = useCallback(
    (path: string) => {
      const content = files.get(path);
      if (content == null) {
        return;
      }

      handleFileSelect(createFileNode(path, content));
    },
    [files, handleFileSelect]
  );

  const handleCopy = useCallback(async () => {
    if (!selectedFile?.content) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedFile]);

  const handleAbortStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /** Update files from AI-generated code blocks */
  const updateFilesFromBlocks = useCallback((blocks: { filename: string; content: string }[]) => {
    if (blocks.length === 0) return;
    setFiles((prev) => {
      const next = new Map(prev);
      for (const b of blocks) {
        next.set(b.filename, b.content);
      }
      return next;
    });
    // Open first new file
    const first = blocks[0];
    const node = createFileNode(first.filename, first.content);
    setSelectedFile(node);
    setOpenTabs((tabs) => {
      const filtered = tabs.filter(
        (tab) => (tab.path ?? tab.name) !== (node.path ?? node.name)
      );
      return [...filtered, node];
    });
    setPreviewKey((k) => k + 1);
  }, []);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    const input = chatInput.trim();
    const assistantId = `a-${Date.now()}`;
    const filesSnapshot = new Map(files);
    const pendingActivity = buildPendingActivity([...filesSnapshot.keys()]);

    setChatMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        activity: pendingActivity,
      },
    ]);
    setRightTab("chat");
    setChatInput("");
    setIsSending(true);
    streamContentRef.current = "";
    abortControllerRef.current = new AbortController();
    scheduleProgressSteps(assistantId);

    try {
      const fileContext = filesSnapshot.size > 0
        ? `\n\nArquivos atuais do projeto:\n${[...filesSnapshot.entries()].map(([name, content]) => `--- ${name} ---\n${content}`).join("\n\n")}`
        : "";

      const systemPrompt = `Voce e um desenvolvedor web expert. O usuario pede para criar ou modificar codigo.

REGRAS IMPORTANTES:
1. SEMPRE coloque o codigo em blocos com o nome do arquivo: \`\`\`nome-do-arquivo.ext
2. Use HTML, CSS, e JavaScript vanilla por padrao (mais facil de pre-visualizar)
3. Crie arquivos completos e funcionais, nao snippets parciais
4. Para projetos web, SEMPRE crie um index.html como arquivo principal
5. Se usar CSS, crie um arquivo styles.css separado
6. Se usar JS, crie um arquivo script.js separado
7. O HTML deve ser completo (<!DOCTYPE html>, <head>, <body>)
8. Use design moderno, escuro, com boa tipografia
9. Explique brevemente o que criou ANTES dos blocos de codigo
10. Se o usuario pedir modificacao, reescreva o arquivo inteiro com as mudancas
11. Antes da explicacao, inclua um unico bloco neste formato exato:
<origem-worklog>{"summary":"...","steps":["..."],"reads":["..."],"searches":["..."]}</origem-worklog>
12. "steps" deve ter de 3 a 5 frases curtas.
13. "reads" deve listar apenas arquivos relevantes do contexto atual.
14. "searches" deve listar o que voce analisou no pedido ou no projeto.
15. Nao use markdown dentro do bloco origem-worklog.${fileContext}`;

      const result = await callChatStream(
        {
          messages: [
            ...chatMessages.filter((m) => m.id !== "welcome").map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            { role: "user", content: input },
          ],
          systemPrompt,
        },
        (fullContent) => {
          streamContentRef.current = fullContent;

          if (streamFrameRef.current != null) {
            return;
          }

          streamFrameRef.current = window.requestAnimationFrame(() => {
            const surfaceText = getChatSurfaceText(streamContentRef.current);

            patchMessage(assistantId, (message) => ({
              ...message,
              content: surfaceText,
            }));

            streamFrameRef.current = null;
          });
        },
        abortControllerRef.current.signal
      );

      const cleanedContent = stripWorklogBlock(result.content);
      const blocks = parseCodeBlocks(cleanedContent);
      const changes = summarizeFileChanges(filesSnapshot, blocks);
      const worklog = extractWorklog(result.content);

      patchMessage(assistantId, (message) => ({
        ...message,
        content: cleanedContent,
        provider: result.provider,
        model: result.model,
        activity: buildCompletedActivity(pendingActivity, worklog, changes),
      }));

      updateFilesFromBlocks(blocks);
    } catch (error) {
      const isAbort =
        error instanceof Error &&
        (error.name === "AbortError" || error.message === "The user aborted a request.");

      if (isAbort) {
        patchMessage(assistantId, (message) => ({
          ...message,
          content:
            getChatSurfaceText(streamContentRef.current) ||
            "Geracao interrompida antes da conclusao.",
          activity: message.activity
            ? {
                ...message.activity,
                status: "error",
                summary: "Geracao interrompida antes da conclusao.",
                finishedAt: Date.now(),
              }
            : undefined,
        }));

        return;
      }

      const fallbackBlocks: { filename: string; content: string }[] = [];

      if (filesSnapshot.size === 0 && input.toLowerCase().includes("cri")) {
        const topic = input.replace(/^(crie?|faca|gere|monte)\s+(uma?\s+)?/i, "").trim() || "projeto";
        fallbackBlocks.push(
          {
            filename: "index.html",
            content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${topic}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <nav>
      <div class="logo">${topic}</div>
      <div class="nav-links">
        <a href="#hero">Inicio</a>
        <a href="#features">Recursos</a>
        <a href="#contact">Contato</a>
      </div>
    </nav>
  </header>

  <section id="hero" class="hero">
    <h1>${topic}</h1>
    <p>Sua solucao completa para o futuro digital.</p>
    <button class="cta-btn">Comecar agora</button>
  </section>

  <section id="features" class="features">
    <h2>Recursos</h2>
    <div class="grid">
      <div class="card">
        <h3>Rapido</h3>
        <p>Performance otimizada para a melhor experiencia.</p>
      </div>
      <div class="card">
        <h3>Seguro</h3>
        <p>Protecao de dados com criptografia avancada.</p>
      </div>
      <div class="card">
        <h3>Moderno</h3>
        <p>Interface intuitiva e design contemporaneo.</p>
      </div>
    </div>
  </section>

  <footer id="contact">
    <p>&copy; 2026 ${topic}. Todos os direitos reservados.</p>
  </footer>

  <script src="script.js"><\/script>
</body>
</html>`,
          },
          {
            filename: "styles.css",
            content: `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #0a0a0a;
  color: #e0e0e0;
  line-height: 1.6;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.2rem;
  font-weight: 700;
  color: #40e0d0;
}

.nav-links { display: flex; gap: 2rem; }
.nav-links a {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
}
.nav-links a:hover { color: #40e0d0; }

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: radial-gradient(ellipse at center, rgba(64, 224, 208, 0.05) 0%, transparent 70%);
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff, #40e0d0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.4);
  max-width: 500px;
  margin-bottom: 2rem;
}

.cta-btn {
  padding: 0.8rem 2rem;
  background: rgba(64, 224, 208, 0.1);
  border: 1px solid rgba(64, 224, 208, 0.3);
  color: #40e0d0;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}
.cta-btn:hover {
  background: rgba(64, 224, 208, 0.2);
  border-color: rgba(64, 224, 208, 0.6);
}

.features {
  padding: 6rem 3rem;
  text-align: center;
}

.features h2 {
  font-size: 2rem;
  margin-bottom: 3rem;
  color: rgba(255, 255, 255, 0.8);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s;
}
.card:hover {
  border-color: rgba(64, 224, 208, 0.2);
  background: rgba(255, 255, 255, 0.05);
}
.card h3 { color: #40e0d0; margin-bottom: 0.5rem; }
.card p { color: rgba(255, 255, 255, 0.4); font-size: 0.9rem; }

footer {
  padding: 3rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.85rem;
}`,
          },
          {
            filename: "script.js",
            content: `// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// CTA button interaction
document.querySelector('.cta-btn')?.addEventListener('click', () => {
  alert('Bem-vindo! Obrigado por seu interesse.');
});

console.log('Projeto inicializado com sucesso!');`,
          },
        );
      }

      if (fallbackBlocks.length > 0) {
        const fallbackChanges = summarizeFileChanges(filesSnapshot, fallbackBlocks);
        updateFilesFromBlocks(fallbackBlocks);

        patchMessage(assistantId, (message) => ({
          ...message,
          content:
            "Nao foi possivel conectar ao provedor de IA. Configure um provedor em Configuracoes > Provedores para gerar codigo.\n\nCriei uma base inicial offline para voce continuar editando no editor.",
          activity: {
            ...buildCompletedActivity(pendingActivity, null, fallbackChanges),
            summary: "Nao houve conexao com a IA, entao gerei uma base inicial offline.",
            status: "complete",
          },
        }));

        return;
      }

      patchMessage(assistantId, (message) => ({
        ...message,
        content:
          "Nao foi possivel conectar ao provedor de IA. Configure um provedor em Configuracoes > Provedores para gerar codigo.",
        activity: message.activity
          ? {
              ...message.activity,
              status: "error",
              summary: "A geracao falhou antes de concluir as alteracoes.",
              finishedAt: Date.now(),
            }
          : undefined,
      }));
    } finally {
      clearProgressTimers();
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }, [
    chatInput,
    isSending,
    chatMessages,
    files,
    clearProgressTimers,
    patchMessage,
    scheduleProgressSteps,
    updateFilesFromBlocks,
  ]);

  // When files change, refresh the file tree and update open tabs
  useEffect(() => {
    const selectedPath = selectedFile?.path ?? selectedFile?.name;

    if (selectedFile && selectedPath && files.has(selectedPath)) {
      const content = files.get(selectedPath)!;
      if (content !== selectedFile.content) {
        const updated = { ...selectedFile, content } as FileNode;
        setSelectedFile(updated);
        setOpenTabs((tabs) =>
          tabs.map((tab) =>
            (tab.path ?? tab.name) === selectedPath ? updated : tab
          )
        );
      }
    }
  }, [files, selectedFile]);

  const lines = selectedFile?.content?.split("\n") ?? [];
  const previewHtml = useMemo(
    () => buildPreviewHtml(files, selectedFile),
    [files, selectedFile]
  );

  useEffect(() => {
    setPreviewKey((k) => k + 1);
  }, [selectedFile, files]);

  const hasFiles = files.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.08_0_0)]">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.05] bg-[oklch(0.065_0_0)] px-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <Code2 className="h-3.5 w-3.5 text-neon-cyan/50" />
          <span className="text-[11px] font-semibold tracking-wide text-white/45">
            ORIGEM Code
          </span>
          {hasFiles && (
            <div className="flex items-center gap-1.5 rounded-full border border-neon-green/20 bg-neon-green/[0.08] px-2 py-0.5">
              <Circle className="h-1.5 w-1.5 fill-neon-green text-neon-green" />
              <span className="text-[9px] font-medium text-neon-green/80">
                {files.size} {files.size === 1 ? "arquivo" : "arquivos"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            title="Explorador"
          >
            {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setRightPanelOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            title="Chat & Preview"
          >
            {rightPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              data-tour="code-files"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 overflow-hidden border-r border-white/[0.05] bg-[oklch(0.065_0_0)]"
            >
              <div className="flex h-8 items-center border-b border-white/[0.04] px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                  Explorer
                </span>
              </div>
              <div className="h-[calc(100%-2rem)] w-[240px] overflow-y-auto">
                {hasFiles ? (
                  <FileTree
                    data={fileTree}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile?.path ?? selectedFile?.name ?? null}
                    className="rounded-none border-0 bg-transparent"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
                    <Plus className="h-5 w-5 text-white/10" />
                    <p className="text-center text-[10px] text-white/20">
                      Use o chat para gerar os arquivos do projeto
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File tabs */}
              <div className="flex h-8 items-center gap-0 border-b border-white/[0.05] bg-[oklch(0.07_0_0)]">
                <div className="flex h-full items-center overflow-x-auto">
                  {openTabs.map((tab) => {
                    const tabPath = tab.path ?? tab.name;
                    const isActive = tabPath === (selectedFile.path ?? selectedFile.name);
                    return (
                      <button
                        key={tabPath}
                        type="button"
                        onClick={() => { setSelectedFile(tab); setCopied(false); }}
                        title={tabPath}
                        className={cn(
                          "group flex h-full items-center gap-2 border-r border-white/[0.03] px-3 text-[11px] transition-colors",
                          isActive
                            ? "border-b-2 border-b-neon-cyan/40 bg-white/[0.03] font-medium text-white/70"
                            : "text-white/30 hover:bg-white/[0.02] hover:text-white/50"
                        )}
                      >
                        <FileCode className={cn("h-3 w-3", isActive ? getExtColor(tab.extension) : "text-white/20")} />
                        {tab.name}
                        <span
                          onClick={(e) => { e.stopPropagation(); handleCloseTab(tabPath); }}
                          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-white/30 opacity-0 transition-all hover:bg-white/[0.08] hover:text-white/50 group-hover:opacity-100"
                        >
                          &times;
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="ml-auto flex items-center gap-0.5 px-2">
                  <button
                    type="button"
                    onClick={() => setWordWrap((v) => !v)}
                    className={cn("flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06]", wordWrap && "text-neon-cyan/60")}
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
                          <td className="select-none pr-4 text-right align-top font-mono text-[11px] leading-5 text-white/30 group-hover:text-white/25" style={{ width: 44 }}>
                            {i + 1}
                          </td>
                          <td className={cn("font-mono text-[12px] leading-5 text-white/75", wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre")}>
                            {line || "\u00A0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex h-6 items-center justify-between border-t border-white/[0.05] bg-[oklch(0.065_0_0)] px-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-white/20">
                    <Terminal className="h-3 w-3" />
                    {lines.length} linhas
                  </span>
                  <span className="text-[10px] text-white/12">UTF-8</span>
                </div>
                <span className={cn("font-mono text-[10px] font-semibold", getExtColor(selectedFile.extension))}>
                  {selectedFile.extension?.toUpperCase() ?? "TXT"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <Sparkles className="h-7 w-7 text-neon-cyan/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/25">
                  ORIGEM Code
                </p>
                <p className="mt-1 max-w-xs text-[11px] text-white/30">
                  {hasFiles
                    ? "Selecione um arquivo no explorer para comecar"
                    : "Use o chat para descrever o que deseja criar. A IA vai gerar os arquivos do projeto automaticamente."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — Chat + Preview */}
        <AnimatePresence initial={false}>
          {rightPanelOpen && (
            <motion.div
              data-tour="code-chat"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-shrink-0 flex-col overflow-hidden border-l border-white/[0.05] bg-[oklch(0.065_0_0)]"
            >
              {/* Tabs */}
              <div className="flex h-8 items-center border-b border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setRightTab("chat")}
                  className={cn(
                    "flex h-full flex-1 items-center justify-center gap-1.5 text-[11px] font-medium transition-colors",
                    rightTab === "chat" ? "border-b-2 border-neon-cyan/40 text-white/70" : "text-white/25 hover:text-white/45"
                  )}
                >
                  <Blocks className="h-3 w-3" />
                  Chat IA
                </button>
                <button
                  data-tour="code-preview"
                  type="button"
                  onClick={() => setRightTab("preview")}
                  className={cn(
                    "flex h-full flex-1 items-center justify-center gap-1.5 text-[11px] font-medium transition-colors",
                    rightTab === "preview" ? "border-b-2 border-neon-green/40 text-white/70" : "text-white/25 hover:text-white/45"
                  )}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>

              {/* Chat tab */}
              {rightTab === "chat" && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-3 py-3.5">
                    <div className="space-y-3">
                      {chatMessages.map((msg) => {
                        const isAssistant = msg.role === "assistant";
                        const surfaceText = isAssistant
                          ? getChatSurfaceText(msg.content)
                          : msg.content;

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2.5",
                              msg.role === "user" && "flex-row-reverse"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border",
                                isAssistant
                                  ? "border-neon-cyan/18 bg-neon-cyan/[0.08]"
                                  : "border-white/[0.07] bg-white/[0.04]"
                              )}
                            >
                              {isAssistant ? (
                                <Bot className="h-3.5 w-3.5 text-neon-cyan/70" />
                              ) : (
                                <User className="h-3.5 w-3.5 text-white/42" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={cn(
                                  "max-w-[92%] rounded-[22px] border px-3.5 py-3",
                                  isAssistant
                                    ? "border-white/[0.07] bg-white/[0.04] text-white/68"
                                    : "ml-auto border-neon-cyan/18 bg-neon-cyan/[0.08] text-white/78"
                                )}
                              >
                                <p className="whitespace-pre-wrap text-[12px] leading-relaxed">
                                  {surfaceText ||
                                    (msg.activity?.status === "streaming"
                                      ? "Trabalhando nas alteracoes..."
                                      : "Resposta pronta. Veja os arquivos gerados no editor.")}
                                </p>

                                {isAssistant && (msg.provider || msg.model) ? (
                                  <p className="mt-2 text-[10px] text-white/28">
                                    {[msg.provider, msg.model].filter(Boolean).join(" · ")}
                                  </p>
                                ) : null}
                              </div>

                              {isAssistant && msg.activity ? (
                                <WorkActivityCard
                                  activity={msg.activity}
                                  onOpenFile={selectFileByPath}
                                />
                              ) : null}
                            </div>
                          </div>
                        );
                      })}

                    <div ref={chatEndRef} />
                    </div>
                  </div>

                  <div className="border-t border-white/[0.05] p-3">
                    <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl">
                      <div className="flex items-center justify-between border-b border-white/[0.05] px-3.5 py-2 text-[10px] text-white/28">
                        <span>Pedir alteracoes adicionais</span>
                        <span>{isSending ? "Gerando..." : "Enter envia"}</span>
                      </div>

                      <div className="px-3.5 pb-3 pt-2.5">
                        <textarea
                          ref={composerRef}
                          rows={1}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (isSending) {
                                handleAbortStream();
                                return;
                              }
                              handleSendChat();
                            }
                          }}
                          placeholder={
                            hasFiles
                              ? "Descreva exatamente o que deve mudar nos arquivos..."
                              : "Descreva o que deseja criar..."
                          }
                          className="max-h-[164px] min-h-[88px] w-full resize-none bg-transparent text-[12px] leading-relaxed text-white/72 placeholder:text-white/18 outline-none"
                        />

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-white/26">
                            Shift + Enter quebra linha
                          </div>

                          <button
                            type="button"
                            onClick={isSending ? handleAbortStream : handleSendChat}
                            disabled={!isSending && !chatInput.trim()}
                            className={cn(
                              "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3.5 text-[11px] font-medium transition-all",
                              isSending
                                ? "border-white/[0.12] bg-white/[0.06] text-white/82 hover:bg-white/[0.1]"
                                : "border-neon-cyan/18 bg-neon-cyan/[0.12] text-neon-cyan/80 hover:bg-neon-cyan/[0.18]",
                              !isSending && !chatInput.trim() && "opacity-30"
                            )}
                          >
                            {isSending ? (
                              <>
                                <Square className="h-3 w-3 fill-current" />
                                Parar
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3" />
                                Enviar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview tab */}
              {rightTab === "preview" && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex h-8 items-center justify-between border-b border-white/[0.04] px-3">
                    <div className="flex items-center gap-1.5">
                      <Circle className="h-1.5 w-1.5 fill-neon-green text-neon-green" />
                      <span className="text-[10px] text-white/30">
                        {selectedFile
                          ? selectedFile.path ?? selectedFile.name
                          : "localhost:3000"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
                      title="Recarregar"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
