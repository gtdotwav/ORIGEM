"use client";

import { useState } from "react";
import {
  Palette,
  Type,
  MousePointerClick,
  Layers,
  Tags,
  BarChart3,
  TextCursorInput,
  Sparkles,
  Navigation,
  Bot,
  Loader2,
  Send,
  ArrowRight,
  Target,
  Gauge,
  Brain,
  Settings,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  Atom,
  FolderKanban,
  Users,
  GitBranch,
  Orbit,
  Activity,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassCard } from "@/components/shared/glass-card";
import { NeonGlow } from "@/components/shared/neon-glow";
import { StatusPulse } from "@/components/shared/status-pulse";
import { LoadingOrb } from "@/components/shared/loading-orb";
import { GradientText } from "@/components/shared/gradient-text";

/* ─── Data Constants ─── */

const NEON_SWATCHES = [
  { name: "Cyan", oklch: "oklch(0.78 0.15 195)", glow: "glow-cyan", tw: "neon-cyan" },
  { name: "Purple", oklch: "oklch(0.65 0.25 290)", glow: "glow-purple", tw: "neon-purple" },
  { name: "Green", oklch: "oklch(0.78 0.2 145)", glow: "glow-green", tw: "neon-green" },
  { name: "Orange", oklch: "oklch(0.75 0.18 55)", glow: "glow-orange", tw: "neon-orange" },
  { name: "Pink", oklch: "oklch(0.70 0.22 340)", glow: "glow-pink", tw: "neon-pink" },
  { name: "Blue", oklch: "oklch(0.65 0.2 250)", glow: "glow-blue", tw: "neon-blue" },
  { name: "White", oklch: "oklch(0.95 0.02 270)", glow: "", tw: "neon-white" },
];

const INTENT_BADGES: Array<{
  intent: string;
  className: string;
}> = [
  { intent: "create", className: "text-green-400 bg-green-400/10 border-green-400/20" },
  { intent: "analyze", className: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  { intent: "design", className: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  { intent: "transform", className: "text-amber-300 bg-amber-300/10 border-amber-300/20" },
  { intent: "question", className: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { intent: "explore", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  { intent: "fix", className: "text-red-400 bg-red-400/10 border-red-400/20" },
  { intent: "compare", className: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  { intent: "summarize", className: "text-white/70 bg-white/[0.08] border-white/20" },
  { intent: "execute", className: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20" },
];

const STATUS_BADGES: Array<{
  status: string;
  className: string;
}> = [
  { status: "idle", className: "text-white/55 border-white/[0.15] bg-white/[0.06]" },
  { status: "thinking", className: "text-cyan-200 border-cyan-300/30 bg-cyan-300/10" },
  { status: "working", className: "text-amber-200 border-amber-300/30 bg-amber-300/10" },
  { status: "done", className: "text-green-200 border-green-300/30 bg-green-300/10" },
  { status: "error", className: "text-red-200 border-red-300/30 bg-red-300/10" },
];

const CONNECTION_BADGES = [
  { label: "Agentes", className: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10" },
  { label: "Projetos", className: "text-blue-300 border-blue-300/30 bg-blue-300/10" },
  { label: "Grupos", className: "text-green-300 border-green-300/30 bg-green-300/10" },
  { label: "Fluxos", className: "text-orange-300 border-orange-300/30 bg-orange-300/10" },
  { label: "Orquestra", className: "text-fuchsia-300 border-fuchsia-300/30 bg-fuchsia-300/10" },
];

const PIPELINE_STAGES = [
  "intake", "decomposing", "routing", "spawning",
  "executing", "branching", "aggregating", "complete",
];

const MODULE_LINKS = [
  { label: "Contextos", icon: Brain, className: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10" },
  { label: "Agentes", icon: Bot, className: "text-blue-200 border-blue-300/20 bg-blue-300/10" },
  { label: "Projetos", icon: FolderKanban, className: "text-indigo-200 border-indigo-300/20 bg-indigo-300/10" },
  { label: "Grupos", icon: Users, className: "text-green-200 border-green-300/20 bg-green-300/10" },
  { label: "Fluxos", icon: GitBranch, className: "text-orange-200 border-orange-300/20 bg-orange-300/10" },
  { label: "Orquestra", icon: Orbit, className: "text-fuchsia-200 border-fuchsia-300/20 bg-fuchsia-300/10" },
];

const OPACITY_STEPS = [100, 90, 70, 55, 45, 40, 35, 30, 25, 15];

/* ─── Section Wrapper ─── */

function SectionCard({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white/90">{title}</h2>
          <p className="mt-0.5 text-xs text-white/40">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/30">
      {children}
    </p>
  );
}

/* ─── Section 1: Color Palette ─── */

function ColorPaletteSection() {
  return (
    <SectionCard
      icon={Palette}
      iconColor="text-neon-cyan"
      title="Color Palette"
      description="7 neon accent colors em OKLch + superficies glass"
    >
      <div className="mb-5 grid grid-cols-7 gap-2.5">
        {NEON_SWATCHES.map((swatch) => (
          <div key={swatch.name} className="text-center">
            <div
              className={`mb-2 h-16 rounded-xl ${swatch.glow}`}
              style={{ backgroundColor: swatch.oklch }}
            />
            <p className="text-xs font-medium text-white/80">{swatch.name}</p>
            <p className="font-mono text-[9px] text-white/30">{swatch.oklch}</p>
          </div>
        ))}
      </div>

      <SubLabel>Glass Surfaces</SubLabel>
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4">
          <p className="text-xs font-medium text-white/70">.glass</p>
          <p className="mt-1 text-[10px] text-white/35">blur 20px + border + bg 60%</p>
        </div>
        <div className="glass-subtle rounded-xl p-4">
          <p className="text-xs font-medium text-white/70">.glass-subtle</p>
          <p className="mt-1 text-[10px] text-white/35">blur 12px + bg 40%</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
          <p className="text-xs font-medium text-white/70">Card padrao</p>
          <p className="mt-1 text-[10px] text-white/35">neutral-900/70 + blur-xl</p>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Section 2: Typography ─── */

function TypographySection() {
  return (
    <SectionCard
      icon={Type}
      iconColor="text-neon-purple"
      title="Typography"
      description="Plus Jakarta Sans (UI) + JetBrains Mono (code)"
    >
      <div className="mb-5 grid grid-cols-2 gap-5">
        <div>
          <SubLabel>Plus Jakarta Sans</SubLabel>
          <div className="space-y-1.5">
            <p className="text-2xl font-semibold text-white">Heading 2xl</p>
            <p className="text-xl font-semibold text-white/90">Heading xl</p>
            <p className="text-base font-semibold text-white/85">Heading base</p>
            <p className="text-sm font-medium text-white/80">Body sm medium</p>
            <p className="text-sm text-white/70">Body sm regular</p>
            <p className="text-xs text-white/60">Caption xs</p>
            <p className="text-[11px] text-white/50">Small 11px</p>
            <p className="text-[10px] text-white/40">Micro 10px</p>
          </div>
        </div>
        <div>
          <SubLabel>JetBrains Mono</SubLabel>
          <div className="space-y-1.5 font-mono">
            <p className="text-2xl font-semibold text-white">Code 2xl</p>
            <p className="text-xl font-semibold text-white/90">Code xl</p>
            <p className="text-base font-semibold text-white/85">Code base</p>
            <p className="text-sm text-white/80">Code sm</p>
            <p className="text-xs text-white/60">Code xs</p>
            <p className="text-[10px] text-white/40">sk-proj-abc...xyz</p>
          </div>
        </div>
      </div>

      <SubLabel>Opacity Scale</SubLabel>
      <div className="mb-5 flex flex-wrap gap-2">
        {OPACITY_STEPS.map((op) => (
          <span
            key={op}
            className="rounded-md border border-white/[0.06] bg-black/20 px-2 py-1 text-xs"
            style={{ color: `rgba(255,255,255,${op / 100})` }}
          >
            {op}%
          </span>
        ))}
      </div>

      <SubLabel>Gradient Text</SubLabel>
      <div className="flex flex-wrap gap-6">
        <GradientText variant="primary" className="text-xl font-semibold">
          Primary Gradient
        </GradientText>
        <GradientText variant="neon" className="text-xl font-semibold">
          Neon Gradient
        </GradientText>
        <GradientText variant="warm" className="text-xl font-semibold">
          Warm Gradient
        </GradientText>
      </div>
    </SectionCard>
  );
}

/* ─── Section 3: Buttons ─── */

function ButtonsSection() {
  return (
    <SectionCard
      icon={MousePointerClick}
      iconColor="text-neon-green"
      title="Buttons"
      description="Padroes ORIGEM + variantes shadcn/ui"
    >
      <SubLabel>ORIGEM Patterns</SubLabel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
        >
          <Send className="h-3.5 w-3.5" />
          Primary
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition-all hover:border-white/[0.24] hover:bg-white/[0.08]"
        >
          Secondary
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-white/70"
        >
          Suggestion Pill
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan disabled:cursor-not-allowed disabled:opacity-40"
        >
          Disabled
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading...
        </button>
      </div>

      <SubLabel>Neon Variants</SubLabel>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["Cyan", "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:border-neon-cyan/60 hover:bg-neon-cyan/20"],
            ["Purple", "border-neon-purple/30 bg-neon-purple/10 text-neon-purple hover:border-neon-purple/60 hover:bg-neon-purple/20"],
            ["Green", "border-neon-green/30 bg-neon-green/10 text-neon-green hover:border-neon-green/60 hover:bg-neon-green/20"],
            ["Orange", "border-neon-orange/30 bg-neon-orange/10 text-neon-orange hover:border-neon-orange/60 hover:bg-neon-orange/20"],
            ["Pink", "border-neon-pink/30 bg-neon-pink/10 text-neon-pink hover:border-neon-pink/60 hover:bg-neon-pink/20"],
            ["Blue", "border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:border-neon-blue/60 hover:bg-neon-blue/20"],
          ] as const
        ).map(([label, cls]) => (
          <button
            key={label}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${cls}`}
          >
            {label}
          </button>
        ))}
      </div>

      <SubLabel>shadcn/ui Button</SubLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><ArrowRight className="h-4 w-4" /></Button>
      </div>
    </SectionCard>
  );
}

/* ─── Section 4: Cards ─── */

function CardsSection() {
  return (
    <SectionCard
      icon={Layers}
      iconColor="text-neon-orange"
      title="Cards"
      description="GlassCard variants, metric cards, direction cards"
    >
      <SubLabel>GlassCard — Hover Neon</SubLabel>
      <div className="mb-5 grid grid-cols-4 gap-2.5">
        {(["cyan", "purple", "green", "orange", "pink", "blue"] as const).map(
          (color) => (
            <GlassCard key={color} neon={color} hover className="text-center">
              <p className="text-xs font-medium text-white/70">{color}</p>
              <p className="mt-1 text-[10px] text-white/30">hover me</p>
            </GlassCard>
          )
        )}
        <GlassCard hover className="text-center">
          <p className="text-xs font-medium text-white/70">plain</p>
          <p className="mt-1 text-[10px] text-white/30">no neon</p>
        </GlassCard>
      </div>

      <SubLabel>Metric Cards</SubLabel>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Sessoes", value: "12", caption: "4 ativas" },
          { label: "Contextos", value: "8", caption: "decomposicoes" },
          { label: "Agentes", value: "5 / 2", caption: "instancias / grupos" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-wide text-white/35">
              {m.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-white">{m.value}</p>
            <p className="text-xs text-white/45">{m.caption}</p>
          </div>
        ))}
      </div>

      <SubLabel>Direction Cards</SubLabel>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2">
          <p className="text-xs text-cyan-100/90">
            Delegar context-map ao Researcher e Planner em paralelo.
          </p>
        </div>
        <div className="rounded-lg border border-blue-300/20 bg-blue-300/10 px-3 py-2">
          <p className="text-xs text-blue-100/90">
            Traduzir contexto em objetivo executavel com roadmap.
          </p>
        </div>
        <div className="rounded-lg border border-green-300/20 bg-green-300/10 px-3 py-2">
          <p className="text-xs text-green-100/90">
            Definir consenso entre Critic e Builder antes do merge.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Section 5: Badges & Status ─── */

function BadgesStatusSection() {
  return (
    <SectionCard
      icon={Tags}
      iconColor="text-neon-pink"
      title="Badges & Status"
      description="Intent badges, status indicators, function badges, connection pills"
    >
      <SubLabel>Intent Badges (10)</SubLabel>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {INTENT_BADGES.map((b) => (
          <span
            key={b.intent}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${b.className}`}
          >
            <Target className="h-3 w-3" />
            {b.intent}
          </span>
        ))}
      </div>

      <SubLabel>Agent Status</SubLabel>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_BADGES.map((b) => (
          <span
            key={b.status}
            className={`rounded-md border px-2 py-0.5 text-[11px] ${b.className}`}
          >
            {b.status}
          </span>
        ))}
      </div>

      <SubLabel>Function & Strategy</SubLabel>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["Contextos", "Projetos", "Agentes", "Grupos", "Agregacao"].map((fn) => (
          <span
            key={fn}
            className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-[11px] text-white/65"
          >
            {fn} · 75%
          </span>
        ))}
        {["consenso", "paralelo", "sequencial", "pipeline"].map((s) => (
          <span
            key={s}
            className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50"
          >
            estrategia: {s}
          </span>
        ))}
      </div>

      <SubLabel>Connection Badges</SubLabel>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CONNECTION_BADGES.map((c) => (
          <span
            key={c.label}
            className={`rounded-lg border px-2.5 py-1 text-[11px] ${c.className}`}
          >
            {c.label}
          </span>
        ))}
      </div>

      <SubLabel>StatusPulse Component</SubLabel>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {(["idle", "active", "success", "error", "warning"] as const).map(
          (status) => (
            <div key={status} className="flex items-center gap-2">
              <StatusPulse status={status} size="md" />
              <span className="text-xs text-white/50">{status}</span>
            </div>
          )
        )}
      </div>

      <SubLabel>shadcn/ui Badge</SubLabel>
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </SectionCard>
  );
}

/* ─── Section 6: Progress & Metrics ─── */

function ProgressMetricsSection() {
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <SectionCard
      icon={BarChart3}
      iconColor="text-neon-blue"
      title="Progress & Metrics"
      description="Progress bars, polarity bars, pipeline stepper, slider"
    >
      <SubLabel>ORIGEM Progress Bar</SubLabel>
      <div className="mb-5 space-y-2.5">
        {[0, 25, 50, 75, 100].map((pct) => (
          <div key={pct} className="flex items-center gap-3">
            <span className="w-8 text-right text-[10px] text-white/40">
              {pct}%
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-neon-cyan/70 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <SubLabel>Neon Color Fills</SubLabel>
      <div className="mb-5 space-y-1.5">
        {[
          ["bg-neon-cyan/70", "Cyan"],
          ["bg-neon-purple/70", "Purple"],
          ["bg-neon-green/70", "Green"],
          ["bg-neon-orange/70", "Orange"],
          ["bg-neon-pink/70", "Pink"],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-14 text-[10px] text-white/40">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full ${cls}`}
                style={{ width: "65%" }}
              />
            </div>
          </div>
        ))}
      </div>

      <SubLabel>Polarity Bars</SubLabel>
      <div className="mb-5 max-w-xs space-y-1.5">
        {[
          ["Complexidade", 0.82],
          ["Urgencia", 0.45],
          ["Certeza", 0.91],
          ["Formalidade", 0.33],
        ].map(([label, value]) => {
          const pct = Math.round((value as number) * 100);
          return (
            <div key={label as string} className="flex items-center gap-2">
              <span className="w-20 text-[10px] text-white/30">
                {label as string}
              </span>
              <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-blue-400/60"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-[10px] text-white/40">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <SubLabel>Pipeline Stage Stepper</SubLabel>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {PIPELINE_STAGES.map((stage, i) => (
          <span
            key={stage}
            className={`rounded-md border px-2 py-0.5 text-[11px] ${
              i <= 4
                ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                : "border-white/[0.10] bg-white/[0.04] text-white/45"
            }`}
          >
            {stage}
          </span>
        ))}
      </div>

      <SubLabel>shadcn Progress + Slider</SubLabel>
      <div className="space-y-4">
        <Progress value={68} className="h-2" />
        <div className="flex items-center gap-3">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="w-8 text-right text-xs text-white/50">
            {sliderValue[0]}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Section 7: Inputs & Forms ─── */

function InputsFormsSection() {
  const [showPw, setShowPw] = useState(false);
  const [switchVal, setSwitchVal] = useState(true);

  return (
    <SectionCard
      icon={TextCursorInput}
      iconColor="text-neon-cyan"
      title="Inputs & Forms"
      description="Campos de entrada, selectors, toggles"
    >
      <SubLabel>ORIGEM Custom Input</SubLabel>
      <div className="mb-4 rounded-xl bg-white/[0.06] px-4 py-3">
        <input
          type="text"
          placeholder="Ask me anything..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          readOnly
        />
      </div>

      <SubLabel>Search Input</SubLabel>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-neutral-900/70 px-4 py-3 backdrop-blur-xl">
        <Search className="h-4 w-4 text-white/20" />
        <input
          type="text"
          placeholder="Buscar por texto, intencao ou dominio..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
          readOnly
        />
      </div>

      <SubLabel>Password Input with Toggle</SubLabel>
      <div className="relative mb-4 max-w-sm">
        <Input
          type={showPw ? "text" : "password"}
          placeholder="sk-proj-..."
          className="pr-10 font-mono text-xs bg-black/20 border-white/[0.06] text-white placeholder:text-white/20"
          defaultValue="sk-proj-abc123def456"
          readOnly
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
        >
          {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <SubLabel>shadcn Input</SubLabel>
          <Input placeholder="Standard input" readOnly />
        </div>
        <div>
          <SubLabel>Select</SubLabel>
          <Select defaultValue="claude-opus-4">
            <SelectTrigger className="text-xs bg-black/20 border-white/[0.06] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-opus-4" className="text-xs">Claude Opus 4</SelectItem>
              <SelectItem value="claude-sonnet-4" className="text-xs">Claude Sonnet 4</SelectItem>
              <SelectItem value="gpt-4o" className="text-xs">GPT-4o</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SubLabel>Textarea</SubLabel>
      <Textarea
        placeholder="Ex: no consenso, o Critic valida risco e o Builder executa no projeto X."
        className="mb-4 h-20 resize-none bg-black/20 border-white/[0.06] text-xs text-white placeholder:text-white/25"
        readOnly
      />

      <SubLabel>Switch + Label</SubLabel>
      <div className="flex items-center gap-3">
        <Switch
          id="demo-switch"
          checked={switchVal}
          onCheckedChange={setSwitchVal}
        />
        <Label htmlFor="demo-switch" className="text-sm text-white/70">
          Habilitar streaming
        </Label>
        <span className="text-[10px] text-white/30">
          {switchVal ? "ON" : "OFF"}
        </span>
      </div>
    </SectionCard>
  );
}

/* ─── Section 8: Effects ─── */

function EffectsSection() {
  return (
    <SectionCard
      icon={Sparkles}
      iconColor="text-neon-purple"
      title="Effects"
      description="Glow, NeonGlow, gradient-border, LoadingOrb, animations"
    >
      <SubLabel>Box Glow (.glow-*)</SubLabel>
      <div className="mb-5 grid grid-cols-6 gap-3">
        {(["cyan", "purple", "green", "orange", "pink", "blue"] as const).map(
          (color) => (
            <div
              key={color}
              className={`glow-${color} flex h-14 items-center justify-center rounded-xl border border-white/[0.08] bg-neutral-900/70`}
            >
              <p className="text-[10px] text-white/50">{color}</p>
            </div>
          )
        )}
      </div>

      <SubLabel>Text Glow</SubLabel>
      <div className="mb-5 flex gap-8">
        <p className="text-glow-cyan text-lg font-semibold text-neon-cyan">
          text-glow-cyan
        </p>
        <p className="text-glow-purple text-lg font-semibold text-neon-purple">
          text-glow-purple
        </p>
      </div>

      <SubLabel>NeonGlow Component — 3 Intensities</SubLabel>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {(["subtle", "medium", "strong"] as const).map((intensity) => (
          <NeonGlow key={intensity} color="cyan" intensity={intensity}>
            <div className="flex h-14 items-center justify-center rounded-xl border border-white/[0.08] bg-neutral-900/70">
              <p className="text-[10px] text-white/50">{intensity}</p>
            </div>
          </NeonGlow>
        ))}
      </div>

      <SubLabel>Gradient Border</SubLabel>
      <div className="gradient-border mb-5 rounded-xl p-4">
        <p className="text-xs text-white/60">
          .gradient-border — animated conic gradient (4s rotate)
        </p>
      </div>

      <SubLabel>LoadingOrb — Sizes & Colors</SubLabel>
      <div className="mb-5 flex items-end gap-8">
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <LoadingOrb size={size} color="cyan" />
            <span className="text-[10px] text-white/30">{size}</span>
          </div>
        ))}
        <div className="h-6 border-l border-white/[0.06]" />
        {(["cyan", "purple", "green", "white"] as const).map((color) => (
          <div key={color} className="flex flex-col items-center gap-2">
            <LoadingOrb size="md" color={color} />
            <span className="text-[10px] text-white/30">{color}</span>
          </div>
        ))}
      </div>

      <SubLabel>Animations</SubLabel>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-pulse-glow rounded-full bg-neon-cyan" />
          <span className="text-[10px] text-white/30">pulse-glow</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-float rounded-lg bg-neon-purple" />
          <span className="text-[10px] text-white/30">float</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
          <span className="text-[10px] text-white/30">spin</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-ping rounded-full bg-neon-orange/60" />
          <span className="text-[10px] text-white/30">ping</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-bounce rounded-lg bg-neon-pink" />
          <span className="text-[10px] text-white/30">bounce</span>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Section 9: Navigation ─── */

function NavigationSection() {
  return (
    <SectionCard
      icon={Navigation}
      iconColor="text-white/60"
      title="Navigation"
      description="Floating nav dropdown, breadcrumb, module grid"
    >
      <SubLabel>Floating Nav Pill</SubLabel>
      <div className="mb-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
          <Atom className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white/90">ORIGEM</span>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/50">Design</span>
          <ChevronDown className="h-3.5 w-3.5 text-white/40" />
        </div>
      </div>

      <SubLabel>Dropdown Preview (static)</SubLabel>
      <div className="mx-auto mb-5 max-w-[520px] rounded-2xl border border-white/[0.08] bg-neutral-900/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Dashboard", desc: "Centro de controle", icon: LayoutDashboard },
            { label: "Contextos", desc: "Mapeamento semantico", icon: Brain },
            { label: "Projetos", desc: "Workflows e objetivos", icon: FolderKanban },
            { label: "Agentes", desc: "Agentes especializados", icon: Bot },
            { label: "Space", desc: "Canvas infinito", icon: Orbit },
            { label: "Grupos", desc: "Coordenacao paralela", icon: Users },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.06]"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                <item.icon className="h-4 w-4 text-white/40" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90">{item.label}</p>
                <p className="text-[11px] leading-snug text-white/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubLabel>Module Grid (Control Page)</SubLabel>
      <div className="grid grid-cols-3 gap-2">
        {MODULE_LINKS.map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border px-2.5 py-2 text-[11px] ${m.className}`}
          >
            <div className="mb-1 inline-flex items-center gap-1">
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Section 10: Agent Cards ─── */

function AgentCardsSection() {
  return (
    <SectionCard
      icon={Bot}
      iconColor="text-neon-cyan"
      title="Agent Cards"
      description="Agent card pattern, recommendation card, loading state"
    >
      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        {/* Agent: Thinking */}
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-white/90">Researcher</p>
              <p className="text-xs text-white/45">Analisa contexto e fontes externas</p>
            </div>
            <span className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[11px] text-cyan-200">
              thinking
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-neon-cyan/70 transition-all"
              style={{ width: "42%" }}
            />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-[11px] text-white/65">
              Contextos · 42%
            </span>
            <span className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-[11px] text-white/65">
              Projetos · 0%
            </span>
          </div>
          <div className="grid gap-1 text-xs text-white/55">
            <p>Modelo: claude-opus-4 · Provider: anthropic</p>
            <p>Outputs: 1</p>
            <p className="text-white/45">
              Ultimo output: Analise do contexto indica 3 dominios primarios com alta...
            </p>
          </div>
        </div>

        {/* Agent: Done */}
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-white/90">Planner</p>
              <p className="text-xs text-white/45">Estrutura roadmap e plano executavel</p>
            </div>
            <span className="rounded-md border border-green-300/30 bg-green-300/10 px-2 py-0.5 text-[11px] text-green-200">
              done
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-neon-green/70 transition-all"
              style={{ width: "100%" }}
            />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-[11px] text-white/65">
              Projetos · 100%
            </span>
            <span className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-[11px] text-white/65">
              Grupos · 100%
            </span>
          </div>
          <div className="grid gap-1 text-xs text-white/55">
            <p>Modelo: gpt-4o · Provider: openai</p>
            <p>Outputs: 3</p>
            <p className="text-white/45">
              Ultimo output: Roadmap estruturado em 4 fases com 12 entregas...
            </p>
          </div>
        </div>
      </div>

      <SubLabel>Recommendation Card</SubLabel>
      <div className="mb-4 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
        <div className="inline-flex items-center gap-1.5 text-sm text-neon-cyan">
          <Sparkles className="h-4 w-4" />
          Proxima etapa recomendada
        </div>
        <p className="mt-1 text-xs text-white/70">
          Consolidar o plano em projeto executavel com base na delegacao atual.
        </p>
        <div className="mt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
          >
            Abrir Projetos
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <SubLabel>Loading State</SubLabel>
      <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
          Carregando agentes da sessao...
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Main Page ─── */

export default function DesignBankingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
          <Palette className="h-5 w-5 text-neon-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">UX/UI Banking</h1>
          <p className="mt-1 text-sm text-white/40">
            Design system feed — todos os tokens, componentes e patterns ORIGEM
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ColorPaletteSection />
        <TypographySection />
        <ButtonsSection />
        <CardsSection />
        <BadgesStatusSection />
        <ProgressMetricsSection />
        <InputsFormsSection />
        <EffectsSection />
        <NavigationSection />
        <AgentCardsSection />
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-white/15">
          ORIGEM Design System v0.1.0 — Psychosemantic AI Engine
        </p>
      </div>
    </div>
  );
}
