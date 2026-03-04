"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Key,
  Monitor,
  Palette,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EcosystemConfig } from "@/components/chat/ecosystem-config";

const SECTIONS = [
  {
    title: "Provedores de IA",
    description:
      "Configure API keys para Claude, GPT, Gemini, Groq, Fireworks e outros. Necessario para ativar decomposicao e agentes.",
    href: "/dashboard/settings/providers",
    icon: Key,
    iconClass: "text-neon-cyan",
    borderClass: "border-neon-cyan/20 hover:border-neon-cyan/40",
    cta: "Gerenciar Provedores",
  },
  {
    title: "Aparencia",
    description:
      "Tema cosmico escuro com neons, glassmorphism e canvas animado. Sempre dark mode.",
    icon: Palette,
    iconClass: "text-fuchsia-300",
    borderClass: "border-fuchsia-300/15 hover:border-fuchsia-300/30",
    badge: "Fixo: Dark Cosmic",
  },
  {
    title: "Idioma",
    description:
      "Interface em portugues com suporte a prompts em qualquer idioma. Os agentes respondem no idioma do contexto.",
    icon: Globe,
    iconClass: "text-blue-300",
    borderClass: "border-blue-300/15 hover:border-blue-300/30",
    badge: "PT-BR",
  },
  {
    title: "Ambiente",
    description:
      "ORIGEM roda em Next.js 16 com App Router, React 19, Tailwind CSS 4 e Zustand 5. Deploy em Vercel.",
    icon: Monitor,
    iconClass: "text-green-300",
    borderClass: "border-green-300/15 hover:border-green-300/30",
    badge: "Next.js 16",
  },
  {
    title: "Controle de Execucao",
    description:
      "Configure o provedor e modelo padrao do modo 360, linguagem das respostas e parametros de execucao dos agentes.",
    icon: SlidersHorizontal,
    iconClass: "text-amber-300",
    borderClass: "border-amber-300/15 hover:border-amber-300/30",
  },
];

export default function SettingsPage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [language, setLanguage] = useState("pt-BR");
  const [runtimeLanguage, setRuntimeLanguage] = useState("pt-BR");

  useEffect(() => {
    setReducedMotion(localStorage.getItem("origem-reduced-motion") === "true");
    setLanguage(localStorage.getItem("origem-language") ?? "pt-BR");
    setRuntimeLanguage(localStorage.getItem("origem-default-runtime-language") ?? "pt-BR");
  }, []);

  const handleMotionToggle = (checked: boolean) => {
    setReducedMotion(checked);
    localStorage.setItem("origem-reduced-motion", String(checked));
    document.documentElement.classList.toggle("reduce-motion", checked);
    toast.success(checked ? "Animacoes reduzidas" : "Animacoes restauradas");
  };

  const LANG_LABELS: Record<string, string> = {
    "pt-BR": "Portugues (BR)",
    "en-US": "Ingles (US)",
    "es-ES": "Espanhol (ES)",
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem("origem-language", value);
    toast.success(`Idioma alterado para ${LANG_LABELS[value] ?? value}`);
  };

  const handleRuntimeLanguageChange = (value: string) => {
    setRuntimeLanguage(value);
    localStorage.setItem("origem-default-runtime-language", value);
    toast.success(`Linguagem de resposta padrao: ${LANG_LABELS[value] ?? value}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
          <Settings className="h-5 w-5 text-white/60" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Configuracoes</h1>
          <p className="mt-1 text-sm text-white/40">
            Configuracoes gerais da plataforma ORIGEM
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className={`rounded-2xl border bg-neutral-900/70 p-5 backdrop-blur-xl transition-all ${section.borderClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                <section.icon className={`h-4 w-4 ${section.iconClass}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white/90">
                    {section.title}
                  </h2>
                  {section.badge && (
                    <span className="rounded-md border border-white/[0.10] bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/50">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-white/45">
                  {section.description}
                </p>

                {section.title === "Aparencia" && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <span className="text-xs text-white/60">Reduzir animacoes</span>
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={handleMotionToggle}
                    />
                  </div>
                )}

                {section.title === "Idioma" && (
                  <div className="mt-3">
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="h-8 w-40 border-white/[0.08] bg-white/[0.04] text-xs text-white/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/[0.08] bg-neutral-900/95 backdrop-blur-xl">
                        <SelectItem value="pt-BR" className="text-xs text-white/70">Portugues (BR)</SelectItem>
                        <SelectItem value="en-US" className="text-xs text-white/70">Ingles (US)</SelectItem>
                        <SelectItem value="es-ES" className="text-xs text-white/70">Espanhol (ES)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {section.title === "Controle de Execucao" && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-wide text-white/35">
                        Configuracao do Ecossistema 360
                      </p>
                      <EcosystemConfig />
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-wide text-white/35">
                        Linguagem padrao das respostas
                      </p>
                      <Select value={runtimeLanguage} onValueChange={handleRuntimeLanguageChange}>
                        <SelectTrigger className="h-8 w-48 border-white/[0.08] bg-white/[0.04] text-xs text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.08] bg-neutral-900/95 backdrop-blur-xl">
                          <SelectItem value="pt-BR" className="text-xs text-white/70">Portugues (BR)</SelectItem>
                          <SelectItem value="en-US" className="text-xs text-white/70">Ingles (US)</SelectItem>
                          <SelectItem value="es-ES" className="text-xs text-white/70">Espanhol (ES)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[10px] leading-relaxed text-white/30">
                      Prioridade de funcoes e notas de execucao sao configuradas por sessao, dentro do painel de Canvas/Orquestra de cada chat.
                    </p>
                  </div>
                )}

                {section.href && (
                  <Link
                    href={section.href}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
                  >
                    {section.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* About */}
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-5 backdrop-blur-xl">
        <div className="mb-3 inline-flex items-center gap-2 text-sm text-white/80">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          Sobre ORIGEM
        </div>
        <p className="text-xs leading-relaxed text-white/45">
          Motor de IA Psicossemantica — Decomponha linguagem em significado atomico,
          orquestre agentes especializados e visualize tudo em um canvas infinito.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md border border-white/[0.10] bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">
            v0.1.0
          </span>
          <span className="rounded-md border border-white/[0.10] bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">
            Psychosemantic Engine
          </span>
          <span className="rounded-md border border-white/[0.10] bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">
            Multi-Agent Orchestration
          </span>
        </div>
      </div>
    </div>
  );
}
