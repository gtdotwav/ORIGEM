"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  Search,
  Layers,
  MousePointerClick,
  Tags,
  BarChart3,
  TextCursorInput,
  Blocks,
  Navigation,
  Bot,
  Loader2,
  Send,
  ArrowRight,
  Target,
  Brain,
  Settings,
  Eye,
  ChevronDown,
  Atom,
  FolderKanban,
  Users,
  GitBranch,
  Orbit,
  LayoutDashboard,
  Zap,
  Copy,
  Check,
  Grid3X3,
  LayoutList,
  X,
  type LucideIcon,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/shared/glass-card";
import { NeonGlow } from "@/components/shared/neon-glow";
import { StatusPulse } from "@/components/shared/status-pulse";
import { LoadingOrb } from "@/components/shared/loading-orb";
import { GradientText } from "@/components/shared/gradient-text";

/* ─── Types ─── */

type Category =
  | "all"
  | "cards"
  | "buttons"
  | "inputs"
  | "badges"
  | "navigation"
  | "feedback"
  | "effects"
  | "data"
  | "layout";

interface ComponentEntry {
  id: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  preview: () => ReactNode;
}

/* ─── Categories ─── */

const CATEGORIES: Array<{ value: Category; label: string; icon: LucideIcon }> = [
  { value: "all", label: "Todos", icon: Grid3X3 },
  { value: "cards", label: "Cards", icon: Layers },
  { value: "buttons", label: "Buttons", icon: MousePointerClick },
  { value: "inputs", label: "Inputs", icon: TextCursorInput },
  { value: "badges", label: "Badges", icon: Tags },
  { value: "navigation", label: "Navigation", icon: Navigation },
  { value: "feedback", label: "Feedback", icon: Zap },
  { value: "effects", label: "Effects", icon: Blocks },
  { value: "data", label: "Data Display", icon: BarChart3 },
  { value: "layout", label: "Layout", icon: LayoutList },
];

/* ─── Preview Renderers ─── */

function PreviewGlassCards() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["cyan", "purple", "green"] as const).map((color) => (
        <GlassCard key={color} neon={color} hover className="p-3 text-center">
          <div
            className="mx-auto mb-1.5 h-6 w-6 rounded-lg"
            style={{
              backgroundColor:
                color === "cyan"
                  ? "oklch(0.78 0.15 195)"
                  : color === "purple"
                    ? "oklch(0.65 0.25 290)"
                    : "oklch(0.78 0.2 145)",
              opacity: 0.6,
            }}
          />
          <p className="text-[9px] text-foreground/50">{color}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function PreviewMetricCards() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Sessoes", value: "12" },
        { label: "Agentes", value: "5" },
        { label: "Contextos", value: "8" },
      ].map((m) => (
        <div
          key={m.label}
          className="rounded-lg border border-foreground/[0.08] bg-card/70 p-2"
        >
          <p className="text-[8px] uppercase text-foreground/30">{m.label}</p>
          <p className="text-lg font-semibold text-foreground">{m.value}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewAgentCard() {
  return (
    <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-neon-cyan" />
          <span className="text-xs font-medium text-foreground/90">Researcher</span>
        </div>
        <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[9px] text-cyan-200">
          thinking
        </span>
      </div>
      <div className="mb-2 h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
        <div className="h-full w-[42%] rounded-full bg-neon-cyan/70" />
      </div>
      <p className="text-[9px] text-foreground/40">claude-opus-4 · anthropic</p>
    </div>
  );
}

function PreviewDirectionCards() {
  return (
    <div className="space-y-1.5">
      <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1.5">
        <p className="text-[9px] text-cyan-100/90">
          Delegar context-map ao Researcher em paralelo
        </p>
      </div>
      <div className="rounded-lg border border-blue-300/20 bg-blue-300/10 px-2.5 py-1.5">
        <p className="text-[9px] text-blue-100/90">
          Traduzir contexto em objetivo executavel
        </p>
      </div>
      <div className="rounded-lg border border-green-300/20 bg-green-300/10 px-2.5 py-1.5">
        <p className="text-[9px] text-green-100/90">
          Definir consenso entre Critic e Builder
        </p>
      </div>
    </div>
  );
}

function PreviewRecommendation() {
  return (
    <div className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
      <div className="mb-1 inline-flex items-center gap-1 text-[10px] text-neon-cyan">
        <Blocks className="h-3 w-3" />
        Proxima etapa recomendada
      </div>
      <p className="mb-2 text-[9px] text-foreground/60">
        Consolidar o plano em projeto executavel.
      </p>
      <div className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/35 bg-neon-cyan/15 px-2 py-1 text-[9px] font-medium text-neon-cyan">
        Abrir Projetos
        <ArrowRight className="h-2.5 w-2.5" />
      </div>
    </div>
  );
}

function PreviewNeonButtons() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[
        ["Cyan", "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"],
        ["Purple", "border-neon-purple/30 bg-neon-purple/10 text-neon-purple"],
        ["Green", "border-neon-green/30 bg-neon-green/10 text-neon-green"],
        ["Orange", "border-neon-orange/30 bg-neon-orange/10 text-neon-orange"],
        ["Pink", "border-neon-pink/30 bg-neon-pink/10 text-neon-pink"],
      ].map(([label, cls]) => (
        <span
          key={label}
          className={`rounded-md border px-2 py-1 text-[9px] font-medium ${cls}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function PreviewPrimaryButtons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1.5 text-[10px] font-medium text-neon-cyan">
        <Send className="h-3 w-3" />
        Primary
      </div>
      <div className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-2.5 py-1.5 text-[10px] text-foreground/70">
        Secondary
      </div>
      <div className="rounded-lg p-1.5 text-foreground/30">
        <Settings className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 py-1 text-[9px] text-foreground/50">
        Suggestion Pill
      </div>
    </div>
  );
}

function PreviewShadcnButtons() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button size="sm" className="h-7 text-[10px]">Default</Button>
      <Button size="sm" variant="destructive" className="h-7 text-[10px]">Destructive</Button>
      <Button size="sm" variant="outline" className="h-7 text-[10px]">Outline</Button>
      <Button size="sm" variant="secondary" className="h-7 text-[10px]">Secondary</Button>
      <Button size="sm" variant="ghost" className="h-7 text-[10px]">Ghost</Button>
    </div>
  );
}

function PreviewIntentBadges() {
  const badges = [
    { intent: "create", cls: "text-green-400 bg-green-400/10 border-green-400/20" },
    { intent: "analyze", cls: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    { intent: "design", cls: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
    { intent: "fix", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    { intent: "explore", cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b.intent}
          className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[8px] font-medium uppercase ${b.cls}`}
        >
          <Target className="h-2.5 w-2.5" />
          {b.intent}
        </span>
      ))}
    </div>
  );
}

function PreviewStatusBadges() {
  const statuses = [
    { s: "idle", cls: "text-foreground/55 border-foreground/[0.15] bg-foreground/[0.06]" },
    { s: "thinking", cls: "text-cyan-200 border-cyan-300/30 bg-cyan-300/10" },
    { s: "working", cls: "text-amber-200 border-amber-300/30 bg-amber-300/10" },
    { s: "done", cls: "text-green-200 border-green-300/30 bg-green-300/10" },
    { s: "error", cls: "text-red-200 border-red-300/30 bg-red-300/10" },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map((b) => (
        <span
          key={b.s}
          className={`rounded-md border px-1.5 py-0.5 text-[9px] ${b.cls}`}
        >
          {b.s}
        </span>
      ))}
    </div>
  );
}

function PreviewStatusPulse() {
  return (
    <div className="flex items-center gap-4">
      {(["idle", "active", "success", "error", "warning"] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <StatusPulse status={s} size="md" />
          <span className="text-[8px] text-foreground/35">{s}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewShadcnBadges() {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge className="text-[9px]">Default</Badge>
      <Badge variant="secondary" className="text-[9px]">Secondary</Badge>
      <Badge variant="destructive" className="text-[9px]">Destructive</Badge>
      <Badge variant="outline" className="text-[9px]">Outline</Badge>
    </div>
  );
}

function PreviewFloatingNav() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5 backdrop-blur-md">
        <Atom className="h-3 w-3 text-blue-400" />
        <span className="text-[10px] font-medium text-foreground/90">ORIGEM</span>
        <span className="text-foreground/20">/</span>
        <span className="text-[10px] text-foreground/50">UX/UI</span>
        <ChevronDown className="h-2.5 w-2.5 text-foreground/40" />
      </div>
      <div className="w-full max-w-[280px] rounded-xl border border-foreground/[0.08] bg-card/95 p-2">
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Dashboard", icon: LayoutDashboard },
            { label: "Contextos", icon: Brain },
            { label: "Projetos", icon: FolderKanban },
            { label: "Agentes", icon: Bot },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-foreground/[0.06]"
            >
              <item.icon className="h-3 w-3 text-foreground/40" />
              <span className="text-[9px] text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewBreadcrumb() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5">
      <Atom className="h-3 w-3 text-blue-400" />
      <span className="text-[10px] text-foreground/70">ORIGEM</span>
      <span className="text-foreground/15">/</span>
      <span className="text-[10px] text-foreground/50">Dashboard</span>
      <span className="text-foreground/15">/</span>
      <span className="text-[10px] text-foreground/90">UX/UI</span>
    </div>
  );
}

function PreviewModuleGrid() {
  const modules = [
    { label: "Contextos", icon: Brain, cls: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10" },
    { label: "Agentes", icon: Bot, cls: "text-blue-200 border-blue-300/20 bg-blue-300/10" },
    { label: "Projetos", icon: FolderKanban, cls: "text-indigo-200 border-indigo-300/20 bg-indigo-300/10" },
    { label: "Grupos", icon: Users, cls: "text-green-200 border-green-300/20 bg-green-300/10" },
    { label: "Fluxos", icon: GitBranch, cls: "text-orange-200 border-orange-300/20 bg-orange-300/10" },
    { label: "Space", icon: Orbit, cls: "text-fuchsia-200 border-fuchsia-300/20 bg-fuchsia-300/10" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {modules.map((m) => (
        <div key={m.label} className={`rounded-md border px-2 py-1.5 ${m.cls}`}>
          <div className="inline-flex items-center gap-1 text-[9px]">
            <m.icon className="h-3 w-3" />
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewProgressBar() {
  return (
    <div className="space-y-2">
      {[25, 65, 100].map((pct) => (
        <div key={pct} className="flex items-center gap-2">
          <span className="w-6 text-right text-[8px] text-foreground/35">{pct}%</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-neon-cyan/70"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewPipelineStepper() {
  const stages = ["intake", "decomposing", "routing", "spawning", "executing", "complete"];
  return (
    <div className="flex flex-wrap gap-1">
      {stages.map((stage, i) => (
        <span
          key={stage}
          className={`rounded-md border px-1.5 py-0.5 text-[8px] ${i <= 3
            ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
            : "border-foreground/[0.10] bg-foreground/[0.04] text-foreground/45"
            }`}
        >
          {stage}
        </span>
      ))}
    </div>
  );
}

function PreviewPolarityBars() {
  const bars = [
    ["Complexidade", 82],
    ["Urgencia", 45],
    ["Certeza", 91],
  ] as const;
  return (
    <div className="space-y-1.5">
      {bars.map(([label, value]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-16 text-[8px] text-foreground/30">{label}</span>
          <div className="h-1 flex-1 rounded-full bg-foreground/[0.06]">
            <div
              className="h-full rounded-full bg-blue-400/60"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="w-6 text-right text-[8px] text-foreground/35">{value}%</span>
        </div>
      ))}
    </div>
  );
}

function PreviewGlassInput() {
  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-foreground/[0.06] px-3 py-2">
        <p className="text-[10px] text-foreground/25">Ask me anything...</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-foreground/[0.08] bg-card/70 px-3 py-2">
        <Search className="h-3 w-3 text-foreground/20" />
        <p className="text-[10px] text-foreground/20">Buscar por texto...</p>
      </div>
    </div>
  );
}

function PreviewFormControls() {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Standard input"
        readOnly
        className="h-8 text-[10px] bg-black/20 border-foreground/[0.06] text-foreground"
      />
      <div className="flex items-center gap-2">
        <Switch checked className="scale-75" />
        <span className="text-[10px] text-foreground/60">Streaming</span>
      </div>
      <Progress value={68} className="h-1.5" />
    </div>
  );
}

function PreviewPasswordInput() {
  return (
    <div className="relative">
      <Input
        type="password"
        defaultValue="sk-proj-abc123"
        readOnly
        className="h-8 pr-8 font-mono text-[10px] bg-black/20 border-foreground/[0.06] text-foreground"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/25">
        <Eye className="h-3 w-3" />
      </div>
    </div>
  );
}

function PreviewGlowBoxes() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["cyan", "purple", "green", "orange", "pink", "blue"] as const).map((color) => (
        <div
          key={color}
          className={`glow-${color} flex h-10 items-center justify-center rounded-lg border border-foreground/[0.08] bg-card/70`}
        >
          <p className="text-[8px] text-foreground/40">{color}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewNeonGlow() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["subtle", "medium", "strong"] as const).map((intensity) => (
        <NeonGlow key={intensity} color="cyan" intensity={intensity}>
          <div className="flex h-10 items-center justify-center rounded-lg border border-foreground/[0.08] bg-card/70">
            <p className="text-[8px] text-foreground/40">{intensity}</p>
          </div>
        </NeonGlow>
      ))}
    </div>
  );
}

function PreviewLoadingOrb() {
  return (
    <div className="flex items-end justify-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <LoadingOrb size="sm" color="cyan" />
        <span className="text-[8px] text-foreground/25">sm</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <LoadingOrb size="md" color="purple" />
        <span className="text-[8px] text-foreground/25">md</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <LoadingOrb size="lg" color="green" />
        <span className="text-[8px] text-foreground/25">lg</span>
      </div>
    </div>
  );
}

function PreviewAnimations() {
  return (
    <div className="flex items-center justify-center gap-5">
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 animate-pulse-glow rounded-full bg-neon-cyan" />
        <span className="text-[8px] text-foreground/25">pulse</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 animate-float rounded-lg bg-neon-purple" />
        <span className="text-[8px] text-foreground/25">float</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
        <span className="text-[8px] text-foreground/25">spin</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-5 animate-bounce rounded-lg bg-neon-pink" />
        <span className="text-[8px] text-foreground/25">bounce</span>
      </div>
    </div>
  );
}

function PreviewGradientBorder() {
  return (
    <div className="gradient-border rounded-xl p-3">
      <p className="text-[9px] text-foreground/50">
        .gradient-border — animated conic gradient
      </p>
    </div>
  );
}

function PreviewColorPalette() {
  const swatches = [
    { name: "Cyan", oklch: "oklch(0.78 0.15 195)" },
    { name: "Purple", oklch: "oklch(0.65 0.25 290)" },
    { name: "Green", oklch: "oklch(0.78 0.2 145)" },
    { name: "Orange", oklch: "oklch(0.75 0.18 55)" },
    { name: "Pink", oklch: "oklch(0.70 0.22 340)" },
    { name: "Blue", oklch: "oklch(0.65 0.2 250)" },
  ];
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {swatches.map((s) => (
        <div key={s.name} className="text-center">
          <div className="mb-1 h-10 rounded-lg" style={{ backgroundColor: s.oklch }} />
          <p className="text-[8px] text-foreground/50">{s.name}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewTypography() {
  return (
    <div className="space-y-1">
      <p className="text-base font-semibold text-foreground">Heading Base</p>
      <p className="text-sm text-foreground/80">Body text sm</p>
      <p className="text-xs text-foreground/55">Caption xs</p>
      <p className="font-mono text-[10px] text-foreground/40">monospace code</p>
      <div className="mt-2 flex gap-3">
        <GradientText variant="primary" className="text-sm font-semibold">Primary</GradientText>
        <GradientText variant="neon" className="text-sm font-semibold">Neon</GradientText>
        <GradientText variant="warm" className="text-sm font-semibold">Warm</GradientText>
      </div>
    </div>
  );
}

function PreviewGlassSurfaces() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="glass rounded-lg p-2">
        <p className="text-[8px] text-foreground/50">.glass</p>
      </div>
      <div className="glass-subtle rounded-lg p-2">
        <p className="text-[8px] text-foreground/50">.glass-subtle</p>
      </div>
      <div className="rounded-lg border border-foreground/[0.08] bg-card/70 p-2">
        <p className="text-[8px] text-foreground/50">card</p>
      </div>
    </div>
  );
}

function PreviewLoadingState() {
  return (
    <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
      <div className="inline-flex items-center gap-2 text-[10px] text-foreground/60">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
        Carregando agentes da sessao...
      </div>
    </div>
  );
}

function PreviewSettingsCard() {
  return (
    <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/[0.06] bg-foreground/[0.03]">
          <Brain className="h-3.5 w-3.5 text-neon-cyan" />
        </div>
        <div>
          <p className="text-[10px] font-medium text-foreground/85">AI Providers</p>
          <p className="text-[8px] text-foreground/35">Configuracao de modelos</p>
        </div>
      </div>
      <div className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/35 bg-neon-cyan/15 px-2 py-1 text-[9px] font-medium text-neon-cyan">
        Configurar
        <ArrowRight className="h-2.5 w-2.5" />
      </div>
    </div>
  );
}

function PreviewGroupStrategy() {
  const strategies = [
    { label: "Paralelo", cls: "text-cyan-200 border-cyan-300/30 bg-cyan-300/10" },
    { label: "Sequencial", cls: "text-purple-200 border-purple-300/30 bg-purple-300/10" },
    { label: "Consenso", cls: "text-orange-200 border-orange-300/30 bg-orange-300/10" },
  ];
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium text-foreground/80">Core Workflow</span>
          <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[8px] text-cyan-200">
            Paralelo
          </span>
        </div>
        <div className="flex gap-1">
          {["Researcher", "Planner"].map((a) => (
            <span
              key={a}
              className="rounded-md border border-foreground/[0.12] bg-foreground/[0.05] px-1.5 py-0.5 text-[8px] text-foreground/60"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        {strategies.map((s) => (
          <span key={s.label} className={`rounded-md border px-1.5 py-0.5 text-[8px] ${s.cls}`}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewTaskCard() {
  return (
    <div className="rounded-xl border border-foreground/[0.08] bg-black/25 p-2.5">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] text-foreground/80">1. Analise de contexto</p>
        <span className="rounded-md border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[8px] text-amber-200">
          running
        </span>
      </div>
      <p className="mb-1.5 text-[8px] text-foreground/40">Agente: Researcher</p>
      <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
        <div className="h-full w-[65%] rounded-full bg-neon-cyan/70" />
      </div>
    </div>
  );
}

function PreviewEventLog() {
  const events = [
    { label: "Mudanca de estagio: routing", time: "14:32:05" },
    { label: "Decomposicao concluida", time: "14:31:58" },
    { label: "Output de agente registrado", time: "14:31:42" },
  ];
  return (
    <div className="space-y-1">
      {events.map((e) => (
        <div
          key={e.time}
          className="rounded-md border border-foreground/[0.08] bg-black/25 px-2 py-1.5"
        >
          <p className="text-[9px] text-foreground/65">{e.label}</p>
          <p className="text-[8px] text-foreground/30">{e.time}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewConnectionBadges() {
  const connections = [
    { label: "Agentes", cls: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10" },
    { label: "Projetos", cls: "text-blue-300 border-blue-300/30 bg-blue-300/10" },
    { label: "Grupos", cls: "text-green-300 border-green-300/30 bg-green-300/10" },
    { label: "Fluxos", cls: "text-orange-300 border-orange-300/30 bg-orange-300/10" },
    { label: "Orquestra", cls: "text-fuchsia-300 border-fuchsia-300/30 bg-fuchsia-300/10" },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {connections.map((c) => (
        <span key={c.label} className={`rounded-lg border px-2 py-0.5 text-[9px] ${c.cls}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

function PreviewTextGlow() {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-glow-cyan text-sm font-semibold text-neon-cyan">
        Glow Cyan
      </p>
      <p className="text-glow-purple text-sm font-semibold text-neon-purple">
        Glow Purple
      </p>
    </div>
  );
}

/* ─── Component Registry ─── */

const COMPONENTS: ComponentEntry[] = [
  // Cards
  {
    id: "glass-cards",
    name: "Glass Card",
    description: "Glassmorphism card com 6 variantes neon hover",
    category: "cards",
    tags: ["glass", "neon", "hover"],
    preview: PreviewGlassCards,
  },
  {
    id: "metric-card",
    name: "Metric Card",
    description: "Card de metrica com label, valor e caption",
    category: "cards",
    tags: ["metric", "dashboard", "stats"],
    preview: PreviewMetricCards,
  },
  {
    id: "agent-card",
    name: "Agent Card",
    description: "Card de agente com status, progress e modelo",
    category: "cards",
    tags: ["agent", "status", "progress"],
    preview: PreviewAgentCard,
  },
  {
    id: "direction-card",
    name: "Direction Card",
    description: "Cards de direcao contextual com bordas coloridas",
    category: "cards",
    tags: ["direction", "context", "colored"],
    preview: PreviewDirectionCards,
  },
  {
    id: "recommendation-card",
    name: "Recommendation Card",
    description: "Card de proxima etapa recomendada com CTA",
    category: "cards",
    tags: ["recommendation", "cta", "next-step"],
    preview: PreviewRecommendation,
  },
  {
    id: "settings-card",
    name: "Settings Section",
    description: "Card de secao com icon box, titulo e acao",
    category: "cards",
    tags: ["settings", "section", "config"],
    preview: PreviewSettingsCard,
  },
  {
    id: "task-card",
    name: "Task Card",
    description: "Card de tarefa runtime com progresso e agente",
    category: "cards",
    tags: ["task", "runtime", "progress"],
    preview: PreviewTaskCard,
  },
  {
    id: "group-strategy",
    name: "Group Strategy Card",
    description: "Card de grupo com estrategia e membros",
    category: "cards",
    tags: ["group", "strategy", "agents"],
    preview: PreviewGroupStrategy,
  },

  // Buttons
  {
    id: "primary-buttons",
    name: "ORIGEM Buttons",
    description: "Primary, secondary, ghost e pill patterns",
    category: "buttons",
    tags: ["primary", "secondary", "ghost", "pill"],
    preview: PreviewPrimaryButtons,
  },
  {
    id: "neon-buttons",
    name: "Neon Buttons",
    description: "Botoes com 6 variantes de cor neon",
    category: "buttons",
    tags: ["neon", "color", "variant"],
    preview: PreviewNeonButtons,
  },
  {
    id: "shadcn-buttons",
    name: "shadcn/ui Button",
    description: "Default, destructive, outline, secondary, ghost",
    category: "buttons",
    tags: ["shadcn", "variant", "radix"],
    preview: PreviewShadcnButtons,
  },

  // Badges
  {
    id: "intent-badges",
    name: "Intent Badges",
    description: "10 badges de intencao semântica coloridos",
    category: "badges",
    tags: ["intent", "semantic", "color"],
    preview: PreviewIntentBadges,
  },
  {
    id: "status-badges",
    name: "Status Badges",
    description: "Idle, thinking, working, done e error",
    category: "badges",
    tags: ["status", "agent", "state"],
    preview: PreviewStatusBadges,
  },
  {
    id: "status-pulse",
    name: "Status Pulse",
    description: "Indicador animado com ping para 5 estados",
    category: "badges",
    tags: ["pulse", "animated", "indicator"],
    preview: PreviewStatusPulse,
  },
  {
    id: "shadcn-badges",
    name: "shadcn/ui Badge",
    description: "Default, secondary, destructive, outline",
    category: "badges",
    tags: ["shadcn", "radix", "variant"],
    preview: PreviewShadcnBadges,
  },
  {
    id: "connection-badges",
    name: "Connection Badges",
    description: "Badges de conexao entre modulos do sistema",
    category: "badges",
    tags: ["connection", "module", "link"],
    preview: PreviewConnectionBadges,
  },

  // Navigation
  {
    id: "floating-nav",
    name: "Floating Nav",
    description: "Nav pill com dropdown de modulos em grid",
    category: "navigation",
    tags: ["nav", "dropdown", "floating"],
    preview: PreviewFloatingNav,
  },
  {
    id: "breadcrumb-pill",
    name: "Breadcrumb Pill",
    description: "Breadcrumb inline com separadores em pill",
    category: "navigation",
    tags: ["breadcrumb", "pill", "path"],
    preview: PreviewBreadcrumb,
  },
  {
    id: "module-grid",
    name: "Module Grid",
    description: "Grid de links para modulos do dashboard",
    category: "navigation",
    tags: ["grid", "module", "dashboard"],
    preview: PreviewModuleGrid,
  },

  // Inputs
  {
    id: "glass-input",
    name: "Glass Input",
    description: "Inputs com glass background e search icon",
    category: "inputs",
    tags: ["glass", "search", "input"],
    preview: PreviewGlassInput,
  },
  {
    id: "form-controls",
    name: "Form Controls",
    description: "Input, switch, progress em composicao",
    category: "inputs",
    tags: ["form", "switch", "progress"],
    preview: PreviewFormControls,
  },
  {
    id: "password-input",
    name: "Password Input",
    description: "Input password com toggle de visibilidade",
    category: "inputs",
    tags: ["password", "toggle", "eye"],
    preview: PreviewPasswordInput,
  },

  // Data
  {
    id: "progress-bar",
    name: "Progress Bar",
    description: "Barra de progresso neon com fill animado",
    category: "data",
    tags: ["progress", "bar", "neon"],
    preview: PreviewProgressBar,
  },
  {
    id: "pipeline-stepper",
    name: "Pipeline Stepper",
    description: "Stepper de estagios do pipeline com estado",
    category: "data",
    tags: ["pipeline", "stepper", "stage"],
    preview: PreviewPipelineStepper,
  },
  {
    id: "polarity-bars",
    name: "Polarity Bars",
    description: "Barras inline com label e porcentagem",
    category: "data",
    tags: ["polarity", "bar", "inline"],
    preview: PreviewPolarityBars,
  },
  {
    id: "event-log",
    name: "Event Log",
    description: "Feed de eventos do pipeline com timestamps",
    category: "data",
    tags: ["event", "log", "feed"],
    preview: PreviewEventLog,
  },

  // Feedback
  {
    id: "loading-orb",
    name: "Loading Orb",
    description: "Loader orbital com 3 tamanhos e 4 cores",
    category: "feedback",
    tags: ["loading", "orb", "spinner"],
    preview: PreviewLoadingOrb,
  },
  {
    id: "loading-state",
    name: "Loading State",
    description: "Card de carregamento com spinner e mensagem",
    category: "feedback",
    tags: ["loading", "skeleton", "state"],
    preview: PreviewLoadingState,
  },

  // Effects
  {
    id: "glow-boxes",
    name: "Box Glow",
    description: "6 cores de glow CSS em boxes (.glow-*)",
    category: "effects",
    tags: ["glow", "css", "color"],
    preview: PreviewGlowBoxes,
  },
  {
    id: "neon-glow-wrap",
    name: "NeonGlow Wrapper",
    description: "Componente wrapper com 3 intensidades de glow",
    category: "effects",
    tags: ["neon", "glow", "intensity"],
    preview: PreviewNeonGlow,
  },
  {
    id: "animations",
    name: "Animations",
    description: "Pulse-glow, float, spin e bounce keyframes",
    category: "effects",
    tags: ["animation", "keyframe", "motion"],
    preview: PreviewAnimations,
  },
  {
    id: "gradient-border",
    name: "Gradient Border",
    description: "Borda animada com conic-gradient rotativo",
    category: "effects",
    tags: ["gradient", "border", "animated"],
    preview: PreviewGradientBorder,
  },
  {
    id: "text-glow",
    name: "Text Glow",
    description: "Texto com efeito glow neon em cyan e purple",
    category: "effects",
    tags: ["text", "glow", "neon"],
    preview: PreviewTextGlow,
  },

  // Layout
  {
    id: "color-palette",
    name: "Color Palette",
    description: "6 cores neon do sistema em OKLch",
    category: "layout",
    tags: ["color", "palette", "oklch"],
    preview: PreviewColorPalette,
  },
  {
    id: "typography",
    name: "Typography Scale",
    description: "Escala tipografica + gradient text variants",
    category: "layout",
    tags: ["type", "font", "gradient"],
    preview: PreviewTypography,
  },
  {
    id: "glass-surfaces",
    name: "Glass Surfaces",
    description: "3 superficies glass com niveis de blur",
    category: "layout",
    tags: ["glass", "surface", "blur"],
    preview: PreviewGlassSurfaces,
  },
];

/* ─── Component Card ─── */

function ComponentCard({
  entry,
  onSelect,
}: {
  entry: ComponentEntry;
  onSelect: (e: ComponentEntry) => void;
}) {
  const [copied, setCopied] = useState(false);
  const categoryMeta = CATEGORIES.find((c) => c.value === entry.category);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(entry.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(entry)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-foreground/[0.08] bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-neon-cyan/50 hover:bg-card/60 hover:shadow-[0_0_30px_-5px_oklch(0.78_0.15_195/0.2)]"
    >
      {/* Hover inner glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-neon-cyan/20 to-transparent" />
      </div>

      {/* Preview area */}
      <div className="relative flex min-h-[160px] items-center justify-center border-b border-foreground/[0.06] bg-black/40 p-5 overflow-hidden">
        {/* Subtle background glow for the preview area */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 opacity-50 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="pointer-events-none relative z-10 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <entry.preview />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100 backdrop-blur-[2px]">
          <span className="flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-black/50 px-4 py-2 text-xs font-medium text-neon-cyan shadow-[0_0_15px_-3px_oklch(0.78_0.15_195/0.4)] backdrop-blur-md">
            <Eye className="h-3.5 w-3.5" />
            Explorar
          </span>
        </div>
      </div>

      {/* Info area */}
      <div className="relative z-10 p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground/90 transition-colors group-hover:text-neon-cyan">
            {entry.name}
          </h3>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md p-1.5 text-foreground/30 transition-all hover:bg-foreground/[0.1] hover:text-neon-cyan"
            title="Copiar ID"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-neon-green" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mb-4 text-[11px] leading-relaxed text-foreground/50 line-clamp-2">
          {entry.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-foreground/[0.03] px-2 py-1 text-[10px] font-medium text-foreground/50 transition-colors group-hover:border-neon-cyan/20 group-hover:bg-neon-cyan/5 group-hover:text-neon-cyan/80">
            {categoryMeta && <categoryMeta.icon className="h-3 w-3" />}
            {categoryMeta?.label}
          </span>
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[9px] font-medium text-foreground/40 transition-colors group-hover:bg-foreground/[0.08]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Modal ─── */

function DetailModal({
  entry,
  onClose,
}: {
  entry: ComponentEntry;
  onClose: () => void;
}) {
  const categoryMeta = CATEGORIES.find((c) => c.value === entry.category);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden rounded-2xl border border-foreground/[0.12] bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/[0.08] px-5 py-3.5">
          <div className="flex items-center gap-3">
            {categoryMeta && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.06] bg-foreground/[0.03]">
                <categoryMeta.icon className="h-4 w-4 text-neon-cyan" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-foreground">{entry.name}</h2>
              <p className="text-xs text-foreground/40">{entry.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground/30 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="border-b border-foreground/[0.08] bg-black/30 p-8">
          <entry.preview />
        </div>

        {/* Meta */}
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-foreground/[0.10] bg-foreground/[0.04] px-2 py-1 text-[11px] text-foreground/50">
              {categoryMeta && <categoryMeta.icon className="h-3 w-3" />}
              {categoryMeta?.label}
            </span>
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-foreground/[0.04] px-2 py-1 text-[11px] text-foreground/30"
              >
                {tag}
              </span>
            ))}
            <span className="ml-auto rounded-md border border-foreground/[0.08] bg-foreground/[0.03] px-2 py-1 font-mono text-[10px] text-foreground/25">
              {entry.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function DesignBankingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selectedEntry, setSelectedEntry] = useState<ComponentEntry | null>(null);

  const filtered = useMemo(() => {
    let items = COMPONENTS;

    if (activeCategory !== "all") {
      items = items.filter((c) => c.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q))
      );
    }

    return items;
  }, [activeCategory, searchQuery]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of COMPONENTS) {
      map[c.category] = (map[c.category] ?? 0) + 1;
    }
    map.all = COMPONENTS.length;
    return map;
  }, []);

  return (
    <div className="relative min-h-screen pb-16">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden">
        {/* Advanced Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000_60%,transparent_100%)] opacity-30" />

        {/* Intense core glow */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3">
          <div className="h-[400px] w-[900px] rounded-full bg-neon-cyan/20 blur-[120px] mix-blend-screen" />
          <div className="absolute left-1/2 top-1/2 h-[200px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/30 blur-[100px] mix-blend-screen" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-32">
        {/* --- Hero Section --- */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-neon-cyan shadow-[0_0_20px_-5px_oklch(0.78_0.15_195/0.3)] backdrop-blur-xl transition-all hover:scale-105">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-cyan opacity-80"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-cyan"></span>
            </span>
            Design System AI-Powered v1.0
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-sm">
            <span className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">ORIGEM</span>{" "}
            <GradientText variant="neon">UXUI SPACE</GradientText>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-foreground/50 sm:text-xl leading-relaxed">
            Um ecossistema unificado de tokens, componentes e padrões de interação guiados por IA. O <strong className="font-medium text-foreground/80">Figma + Framer + v0</strong> interno da ORIGEM.
          </p>
        </div>

        {/* --- AI Intelligence Layer (Prompt) --- */}
        <div className="mx-auto mb-24 max-w-3xl">
          <div className="group relative rounded-[2rem] border border-foreground/10 bg-black/40 p-2 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-neon-cyan/40 focus-within:border-neon-cyan/50 focus-within:shadow-[0_0_50px_-10px_oklch(0.78_0.15_195/0.3)]">
            {/* Animated border glow */}
            <div className="pointer-events-none absolute inset-[-1px] rounded-[2rem] bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/40 to-neon-purple/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

            <div className="relative flex min-h-[72px] items-center gap-4 rounded-3xl border border-foreground/5 bg-black/60 px-6 py-2 shadow-inner">
              <Blocks className="h-6 w-6 animate-pulse text-neon-cyan shrink-0" />
              <input
                type="text"
                placeholder="Gerar uma Landing Page SaaS com tema Liquid Glass..."
                className="w-full bg-transparent text-base text-foreground placeholder:text-foreground/30 outline-none"
              />
              <button className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-neon-cyan to-neon-cyan/80 px-6 font-bold tracking-wide text-black transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_oklch(0.78_0.15_195/0.4)]">
                <Wand2 className="mr-2 h-4 w-4" />
                Gerar UI
              </button>
            </div>
            {/* Quick Prompts */}
            <div className="mt-4 flex flex-wrap justify-center gap-2.5 px-2 pb-2">
              {[
                "Dashboard Financeiro",
                "Formulário Multistep Dark",
                "Pricing Tier Glass",
                "Tabela de Dados Complexa"
              ].map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-foreground/10 bg-gradient-to-b from-foreground/5 to-transparent px-4 py-1.5 text-xs font-medium text-foreground/50 transition-all hover:-translate-y-0.5 hover:border-neon-cyan/40 hover:text-neon-cyan hover:shadow-[0_0_15px_-3px_oklch(0.78_0.15_195/0.2)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Library Controls --- */}
        <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          {/* Categories */}
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setActiveCategory(cat.value)}
                  className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 ${isActive
                    ? "border-neon-cyan bg-neon-cyan/15 text-neon-cyan shadow-[0_0_15px_-3px_oklch(0.78_0.15_195/0.4)] backdrop-blur-md"
                    : "border-foreground/10 bg-card/30 text-foreground/50 hover:border-foreground/30 hover:bg-card/50 hover:text-foreground/80 backdrop-blur-sm"
                    }`}
                >
                  <cat.icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  {cat.label}
                  <span
                    className={`ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] transition-colors ${isActive
                      ? "bg-neon-cyan text-black"
                      : "bg-foreground/10 text-foreground/50 group-hover:bg-foreground/20"
                      }`}
                  >
                    {counts[cat.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full max-w-sm shrink-0">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30 transition-colors peer-focus:text-neon-cyan" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nos 1000+ elementos..."
              className="peer w-full rounded-full border border-foreground/[0.1] bg-card/40 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/30 outline-none backdrop-blur-xl transition-all focus:border-neon-cyan/50 focus:bg-card/60 focus:shadow-[0_0_20px_-5px_oklch(0.78_0.15_195/0.2)]"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-foreground/30">
            {filtered.length} componente{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "all" &&
              ` em ${CATEGORIES.find((c) => c.value === activeCategory)?.label}`}
            {searchQuery.trim() && ` para "${searchQuery}"`}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-foreground/[0.05] bg-card/20 p-16 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/[0.03]">
              <Search className="h-8 w-8 text-foreground/20" />
            </div>
            <p className="text-base font-medium text-foreground/70">Nenhum componente encontrado</p>
            <p className="mt-2 text-sm text-foreground/40">
              Tente outra busca ou solicite a IA para gerar este componente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <ComponentCard
                key={entry.id}
                entry={entry}
                onSelect={setSelectedEntry}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 border-t border-foreground/[0.05] pt-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neon-purple/20 bg-neon-purple/5 px-4 py-2">
            <Blocks className="h-3 w-3 text-neon-purple" />
            <p className="text-xs font-medium text-neon-purple/80">
              ORIGEM UX/UI SPACE v1.0 — 1000+ AI-Ready Components
            </p>
          </div>
        </div>

        {/* Detail modal */}
        {selectedEntry && (
          <DetailModal
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </div>
    </div>
  );
}
