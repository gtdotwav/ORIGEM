import {
  Monitor,
  Smartphone,
  TabletSmartphone,
  type LucideIcon,
} from "lucide-react";
import type { FileNode } from "@/components/ui/file-tree";
import type { SessionHandoffPayload } from "@/lib/session-handoff";

export type ActivityStepState = "pending" | "active" | "done";

export interface ActivityStep {
  id: string;
  label: string;
  state: ActivityStepState;
}

export interface FileChangeSummary {
  path: string;
  status: "created" | "updated";
  addedLines: number;
  removedLines: number;
}

export interface MessageWorkActivity {
  summary: string;
  status: "streaming" | "complete" | "error";
  startedAt: number;
  finishedAt?: number;
  steps: ActivityStep[];
  reads: string[];
  searches: string[];
  changes: FileChangeSummary[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  activity?: MessageWorkActivity;
}

export interface ParsedWorklog {
  summary: string;
  steps: string[];
  reads: string[];
  searches: string[];
}

export type CenterTab = "preview" | "editor";
export type PreviewViewport = "desktop" | "tablet" | "mobile";
export type CodeSurface =
  | "landing-page"
  | "dashboard"
  | "web-app"
  | "component"
  | "marketing-site";
export type CodeStack =
  | "preview-safe"
  | "react"
  | "next-tailwind"
  | "component-only";
export type CodeViewportTarget =
  | "responsive"
  | "mobile-first"
  | "desktop-first";
export type CodeAesthetic =
  | "minimal"
  | "product"
  | "editorial"
  | "premium"
  | "playful";

export interface CodeProjectBrief {
  surface: CodeSurface;
  stack: CodeStack;
  viewport: CodeViewportTarget;
  aesthetic: CodeAesthetic;
  notes: string;
}

export const CODE_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Defina o brief ao lado e descreva o que precisa. Eu vou produzir os arquivos com base no formato, stack, viewport e direcao visual escolhidos.",
  timestamp: 0,
};

const WORKLOG_REGEX = /<origem-worklog>\s*([\s\S]*?)\s*<\/origem-worklog>/i;

export const SURFACE_OPTIONS: Array<{ value: CodeSurface; label: string }> = [
  { value: "landing-page", label: "Landing page" },
  { value: "dashboard", label: "Dashboard" },
  { value: "web-app", label: "Web app" },
  { value: "marketing-site", label: "Marketing site" },
  { value: "component", label: "Componente" },
];

export const STACK_OPTIONS: Array<{
  value: CodeStack;
  label: string;
  hint: string;
}> = [
  {
    value: "preview-safe",
    label: "HTML/CSS/JS",
    hint: "Mais fiel no preview local",
  },
  {
    value: "react",
    label: "React",
    hint: "SPA/componentes em React",
  },
  {
    value: "next-tailwind",
    label: "Next + Tailwind",
    hint: "Estrutura App Router",
  },
  {
    value: "component-only",
    label: "Somente componente",
    hint: "Foco em bloco reutilizavel",
  },
];

export const VIEWPORT_OPTIONS: Array<{
  value: CodeViewportTarget;
  label: string;
}> = [
  { value: "responsive", label: "Responsivo" },
  { value: "mobile-first", label: "Mobile first" },
  { value: "desktop-first", label: "Desktop first" },
];

export const AESTHETIC_OPTIONS: Array<{
  value: CodeAesthetic;
  label: string;
}> = [
  { value: "minimal", label: "Minimal" },
  { value: "product", label: "Product UI" },
  { value: "editorial", label: "Editorial" },
  { value: "premium", label: "Premium" },
  { value: "playful", label: "Playful" },
];

export const PREVIEW_VIEWPORTS: Array<{
  value: PreviewViewport;
  label: string;
  widthClass: string;
  containerClass: string;
  icon: LucideIcon;
}> = [
  {
    value: "desktop",
    label: "PC",
    widthClass: "w-full max-w-[1180px]",
    containerClass: "h-[calc(100vh-18rem)] min-h-[560px]",
    icon: Monitor,
  },
  {
    value: "tablet",
    label: "Tablet",
    widthClass: "w-[820px] max-w-full",
    containerClass: "h-[calc(100vh-18rem)] min-h-[620px]",
    icon: TabletSmartphone,
  },
  {
    value: "mobile",
    label: "Mobile",
    widthClass: "w-[390px] max-w-full",
    containerClass: "h-[720px] max-h-[calc(100vh-18rem)] min-h-[620px]",
    icon: Smartphone,
  },
];

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

export function extractWorklog(text: string): ParsedWorklog | null {
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

export function stripWorklogBlock(text: string): string {
  return text.replace(WORKLOG_REGEX, "").trim();
}

export function getChatSurfaceText(text: string): string {
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

export function createFileNode(path: string, content: string): FileNode {
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

export function buildPendingActivity(
  existingPaths: string[]
): MessageWorkActivity {
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

export function advanceActivitySteps(
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

function computeLineDelta(
  previousContent: string | undefined,
  nextContent: string
) {
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

export function summarizeFileChanges(
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

export function buildCompletedActivity(
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

export function parseCodeBlocks(text: string): {
  filename: string;
  content: string;
}[] {
  const blocks: { filename: string; content: string }[] = [];
  const regex = /```(?:(\w+):)?([^\n`]+)?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const lang = match[1] ?? "";
    const filename = (match[2] ?? "").trim();
    const code = match[3] ?? "";

    if (filename && code.trim()) {
      blocks.push({ filename, content: code.trim() });
      continue;
    }

    if (code.trim() && lang) {
      const ext =
        lang === "typescript" || lang === "tsx"
          ? "tsx"
          : lang === "javascript" || lang === "jsx"
            ? "jsx"
            : lang === "css"
              ? "css"
              : lang === "html"
                ? "html"
                : lang;

      blocks.push({ filename: `code.${ext}`, content: code.trim() });
    }
  }

  return blocks;
}

export function buildFileTree(files: Map<string, string>): FileNode[] {
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

export function buildPreviewHtml(
  files: Map<string, string>,
  currentFile: FileNode | null
): string {
  const htmlFile = files.get("index.html") ?? files.get("page.html");
  const cssFile =
    files.get("styles.css") ??
    files.get("style.css") ??
    files.get("globals.css") ??
    "";
  const jsFile =
    files.get("script.js") ?? files.get("main.js") ?? files.get("app.js") ?? "";

  if (htmlFile) {
    let html = htmlFile
      .replace(/<link[^>]+href=["'][^"']+\.(css)["'][^>]*>/gi, "")
      .replace(
        /<script[^>]+src=["'][^"']+\.(js)["'][^>]*>\s*<\/script>/gi,
        ""
      );

    if (cssFile) {
      html = html.includes("</head>")
        ? html.replace("</head>", `<style>${cssFile}</style></head>`)
        : `${html}<style>${cssFile}</style>`;
    }

    if (jsFile) {
      html = html.includes("</body>")
        ? html.replace("</body>", `<script>${jsFile}<\/script></body>`)
        : `${html}<script>${jsFile}<\/script>`;
    }

    return html;
  }

  const content = currentFile?.content ?? "";
  const ext = currentFile?.extension ?? "";
  const isTsx = ext === "tsx" || ext === "jsx";

  if (isTsx) {
    const returnMatch = content.match(
      /return\s*\(\s*([\s\S]*?)\s*\)\s*\}?\s*$/m
    );
    const bodyContent = returnMatch
      ? returnMatch[1]
          .replace(/className=/g, "class=")
          .replace(/\{[^}]*\}/g, "")
      : "";

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;font-family:system-ui;background:#000;color:#fff}</style></head><body class="dark bg-black text-white">${bodyContent || '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#444">Preview</div>'}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{margin:0;background:#000;color:#888;font-family:monospace;padding:20px;font-size:12px;white-space:pre-wrap}</style></head><body>${content.replace(/</g, "&lt;") || "Selecione um arquivo para preview"}</body></html>`;
}

export function getExtColor(ext?: string): string {
  switch (ext) {
    case "tsx":
    case "ts":
      return "text-neon-cyan/70";
    case "jsx":
    case "js":
      return "text-yellow-400/70";
    case "css":
      return "text-neon-purple/70";
    case "html":
      return "text-orange-400/70";
    case "json":
      return "text-neon-orange/70";
    default:
      return "text-white/40";
  }
}

export function getBriefLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function buildBriefPrompt(brief: CodeProjectBrief) {
  const parts = [
    `Formato: ${getBriefLabel(SURFACE_OPTIONS, brief.surface)}`,
    `Stack preferida: ${getBriefLabel(STACK_OPTIONS, brief.stack)}`,
    `Viewport alvo: ${getBriefLabel(VIEWPORT_OPTIONS, brief.viewport)}`,
    `Direcao visual: ${getBriefLabel(AESTHETIC_OPTIONS, brief.aesthetic)}`,
  ];

  if (brief.notes.trim()) {
    parts.push(`Contexto adicional: ${brief.notes.trim()}`);
  }

  return parts.join("\n- ");
}

export function inferSurfaceFromImportedContext(summary: string): CodeSurface {
  const normalized = summary.toLowerCase();

  if (/(dashboard|painel|analytics|admin)/.test(normalized)) {
    return "dashboard";
  }

  if (/(landing|lp|marketing|site|homepage)/.test(normalized)) {
    return "landing-page";
  }

  if (/(componente|component|card|widget|section)/.test(normalized)) {
    return "component";
  }

  return "web-app";
}

function buildFileContext(
  filesSnapshot: Map<string, string>,
  currentSelection: string | null
) {
  const fileEntries = [...filesSnapshot.entries()];
  if (fileEntries.length === 0) {
    return "";
  }

  const fileInventory = fileEntries.map(([name]) => `- ${name}`).join("\n");
  const focusedFileContent =
    currentSelection && filesSnapshot.has(currentSelection)
      ? filesSnapshot.get(currentSelection)
      : null;
  const supportingFiles = fileEntries
    .filter(([name]) => name !== currentSelection)
    .slice(0, 5)
    .map(([name, content]) => `--- ${name} ---\n${content.slice(0, 3200)}`)
    .join("\n\n");

  return `\n\nESTRUTURA ATUAL DO PROJETO:\n${fileInventory}${focusedFileContent ? `\n\nARQUIVO EM FOCO (${currentSelection}):\n${focusedFileContent}` : ""}${supportingFiles ? `\n\nARQUIVOS DE APOIO:\n${supportingFiles}` : ""}`;
}

interface BuildCodeSystemPromptOptions {
  brief: CodeProjectBrief;
  filesSnapshot: Map<string, string>;
  currentSelection: string | null;
  activeHandoff: SessionHandoffPayload | null;
}

export function buildCodeSystemPrompt({
  brief,
  filesSnapshot,
  currentSelection,
  activeHandoff,
}: BuildCodeSystemPromptOptions) {
  const briefContext = buildBriefPrompt(brief);
  const fileContext = buildFileContext(filesSnapshot, currentSelection);
  const importedContext = activeHandoff
    ? `\n\nCONTEXTO IMPORTADO DA ORQUESTRA:\n${activeHandoff.codePrompt}`
    : "";

  return `Voce e um desenvolvedor web expert. O usuario pede para criar ou modificar codigo.

BRIEF DO PROJETO:
- ${briefContext}
${currentSelection ? `- Arquivo em foco: ${currentSelection}` : ""}

REGRAS IMPORTANTES:
1. Antes da explicacao, inclua um unico bloco neste formato exato:
<origem-worklog>{"summary":"...","steps":["..."],"reads":["..."],"searches":["..."]}</origem-worklog>
2. "steps" deve ter de 3 a 5 frases curtas.
3. "reads" deve listar apenas arquivos relevantes do contexto atual.
4. "searches" deve listar o que voce analisou no pedido ou no projeto.
5. Nao use markdown dentro do bloco origem-worklog.
6. Depois do worklog, explique brevemente o que criou antes dos blocos de codigo.
7. Sempre coloque o codigo em blocos com o nome do arquivo: \`\`\`nome-do-arquivo.ext
8. Respeite o brief do projeto antes de decidir arquitetura, hierarquia, componentes e estilo.
9. Crie arquivos completos e funcionais, nunca snippets parciais.
10. Se a stack preferida for "HTML/CSS/JS", use HTML, CSS e JavaScript vanilla por padrao.
11. Se a stack preferida for React ou Next, gere arquivos completos dessa stack e preserve uma experiencia de preview local quando isso for viavel.
12. Para projetos web novos em preview-safe, use index.html como entrada principal, styles.css para estilos e script.js para interacoes.
13. O HTML deve ser completo (<!DOCTYPE html>, <head>, <body>) e responsivo.
14. Se o usuario pedir modificacao, reescreva o arquivo inteiro com as mudancas.
15. Priorize uma experiencia visual intencional, limpa e bem acabada, evitando layout generico.
16. Se estiver criando algo novo, proponha uma estrutura de arquivos pequena, clara e coerente.
17. Se o preview local ficar mais forte com uma versao demonstrativa extra, voce pode incluir um arquivo de preview desde que a estrutura principal continue correta.${importedContext}${fileContext}`;
}

export function buildOfflineStarterFiles(input: string) {
  if (!input.toLowerCase().includes("cri")) {
    return [];
  }

  const topic =
    input
      .replace(/^(crie?|faca|gere|monte)\s+(uma?\s+)?/i, "")
      .trim() || "projeto";

  return [
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
      content: `document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

document.querySelector('.cta-btn')?.addEventListener('click', () => {
  alert('Bem-vindo! Obrigado por seu interesse.');
});

console.log('Projeto inicializado com sucesso!');`,
    },
  ];
}
