"use client";

import { useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Lock,
  Clock,
  Users,
  Shield,
  FileText,
  Check,
  Film,
  Gamepad2,
  Paintbrush,
  BookOpen,
  Bot,
  Star,
} from "lucide-react";
import { useKidsStore, type AgeRange } from "@/stores/kids-store";

const TIME_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 0, label: "Sem limite" },
];

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: "4-6", label: "4 — 6 anos" },
  { value: "7-9", label: "7 — 9 anos" },
  { value: "10-12", label: "10 — 12 anos" },
];

type SectionOption = {
  id: string;
  icon: LucideIcon;
  label: string;
};

const SECTION_OPTIONS: SectionOption[] = [
  { id: "videos", icon: Film, label: "Videos" },
  { id: "games", icon: Gamepad2, label: "Jogos" },
  { id: "art", icon: Paintbrush, label: "Arte" },
  { id: "stories", icon: BookOpen, label: "Historias" },
  { id: "companion", icon: Bot, label: "Companheiro IA" },
  { id: "challenges", icon: Star, label: "Desafios" },
];

const ACTIVITY_LOG = [
  { section: "Videos", time: "25 min", date: "Hoje" },
  { section: "Jogos", time: "18 min", date: "Hoje" },
  { section: "Historias", time: "12 min", date: "Ontem" },
  { section: "Desafios", time: "10 min", date: "Ontem" },
  { section: "Arte", time: "30 min", date: "2 dias atras" },
];

export default function KidsParentalPage() {
  const {
    ageRange,
    setAgeRange,
    timeLimit,
    setTimeLimit,
    enabledSections,
    toggleSection,
  } = useKidsStore();

  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const parentalPin = useKidsStore((s) => s.parentalPin);

  const handleUnlock = () => {
    if (pinInput === parentalPin) {
      setUnlocked(true);
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-orange/25 bg-neon-orange/10">
          <Lock className="h-8 w-8 text-neon-orange" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          Controle Parental
        </h1>
        <p className="mb-6 text-center text-sm text-foreground/50">
          Digite o PIN de 4 digitos para acessar
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUnlock();
            }}
            placeholder="••••"
            className="w-32 rounded-xl border border-foreground/[0.08] bg-card/70 px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground placeholder:text-foreground/20 outline-none focus:border-neon-orange/40"
          />
          <button
            type="button"
            onClick={handleUnlock}
            className="rounded-xl border border-neon-orange/30 bg-neon-orange/10 px-5 py-3 text-sm font-medium text-neon-orange transition-all hover:border-neon-orange/60 hover:bg-neon-orange/20"
          >
            Entrar
          </button>
        </div>
        <p className="mt-3 text-[11px] text-foreground/30">PIN padrao: 1234</p>
        <Link
          href="/dashboard/kids"
          className="mt-6 text-xs text-foreground/40 hover:text-foreground/60"
        >
          Voltar ao ORIGEM Kids
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <Link
          href="/dashboard/kids"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 transition-colors hover:text-foreground/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-orange/25 bg-neon-orange/10">
          <Lock className="h-5 w-5 text-neon-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Controle Parental
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            Gerencie o acesso e acompanhe a atividade
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Time limit */}
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-neon-cyan" />
            <h2 className="text-sm font-semibold text-foreground/80">
              Limite de Tempo Diario
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimeLimit(opt.value)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  timeLimit === opt.value
                    ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                    : "border-foreground/[0.06] bg-foreground/[0.03] text-foreground/40 hover:bg-foreground/[0.06] hover:text-foreground/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age range */}
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-neon-purple" />
            <h2 className="text-sm font-semibold text-foreground/80">
              Faixa Etaria
            </h2>
          </div>
          <div className="flex gap-2">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgeRange(opt.value)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  ageRange === opt.value
                    ? "border-neon-purple/30 bg-neon-purple/10 text-neon-purple"
                    : "border-foreground/[0.06] bg-foreground/[0.03] text-foreground/40 hover:bg-foreground/[0.06] hover:text-foreground/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Allowed sections */}
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-neon-green" />
            <h2 className="text-sm font-semibold text-foreground/80">
              Conteudo Permitido
            </h2>
          </div>
          <div className="space-y-2">
            {SECTION_OPTIONS.map((sec) => {
              const enabled = enabledSections.includes(sec.id);
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all ${
                    enabled
                      ? "border-neon-green/20 bg-neon-green/5"
                      : "border-foreground/[0.06] bg-foreground/[0.02]"
                  }`}
                >
                  <sec.icon className="h-5 w-5 text-foreground/60" />
                  <span
                    className={`flex-1 text-sm ${
                      enabled ? "text-foreground/75" : "text-foreground/30"
                    }`}
                  >
                    {sec.label}
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                      enabled
                        ? "border-neon-green/40 bg-neon-green/15"
                        : "border-foreground/10 bg-foreground/[0.03]"
                    }`}
                  >
                    {enabled && (
                      <Check className="h-3 w-3 text-neon-green" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity report */}
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-neon-orange" />
            <h2 className="text-sm font-semibold text-foreground/80">
              Relatorio de Atividade
            </h2>
          </div>
          <div className="space-y-1">
            <div className="mb-2 grid grid-cols-3 text-[10px] font-semibold uppercase tracking-wide text-foreground/30">
              <span>Secao</span>
              <span className="text-center">Tempo</span>
              <span className="text-right">Data</span>
            </div>
            {ACTIVITY_LOG.map((entry, i) => (
              <div
                key={i}
                className="grid grid-cols-3 rounded-lg px-2 py-2 text-sm odd:bg-foreground/[0.02]"
              >
                <span className="text-foreground/60">{entry.section}</span>
                <span className="text-center text-foreground/40">
                  {entry.time}
                </span>
                <span className="text-right text-foreground/30">{entry.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
