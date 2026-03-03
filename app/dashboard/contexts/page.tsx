"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Gauge,
  Loader2,
  Search,
  Tags,
  Target,
} from "lucide-react";
import { hydrateSessionSnapshot } from "@/lib/chat-backend-client";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useSessionStore } from "@/stores/session-store";
import type { DecompositionResult, Intent } from "@/types/decomposition";

const INTENT_COLORS: Record<Intent, string> = {
  create: "text-green-400 bg-green-400/10 border-green-400/20",
  analyze: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  design: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  transform: "text-amber-300 bg-amber-300/10 border-amber-300/20",
  question: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  explore: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  fix: "text-red-400 bg-red-400/10 border-red-400/20",
  compare: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  summarize: "text-white/70 bg-white/[0.08] border-white/20",
  execute: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
};

function getMetadataDecompositionId(
  metadata: Record<string, unknown> | undefined
): string | null {
  const decompositionId = metadata?.decompositionId;
  return typeof decompositionId === "string" ? decompositionId : null;
}

function formatIntent(intent: Intent) {
  return intent.replace(/_/g, " ");
}

function PolarityBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[10px] text-white/30">{label}</span>
      <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-blue-400/60 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-[10px] text-white/40">
        {percent}%
      </span>
    </div>
  );
}

function matchesSearch(result: DecompositionResult, search: string) {
  if (!search.trim()) {
    return true;
  }

  const normalized = search.toLowerCase().trim();
  const domainList = result.context.domains.map((domain) => domain.domain);

  return (
    result.inputText.toLowerCase().includes(normalized) ||
    result.intent.primary.toLowerCase().includes(normalized) ||
    domainList.some((domain) => domain.toLowerCase().includes(normalized))
  );
}

function ContextsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const [search, setSearch] = useState("");
  const [isHydrating, setIsHydrating] = useState(false);
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

  const sessions = useSessionStore((state) => state.sessions);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);
  const decompositions = useDecompositionStore((state) => state.decompositions);
  const activeDecompositionId = useDecompositionStore(
    (state) => state.activeDecompositionId
  );

  const targetSessionId = querySessionId ?? currentSessionId ?? null;
  const targetSession = targetSessionId
    ? sessions.find((session) => session.id === targetSessionId) ?? null
    : null;

  const contextResults = useMemo(() => {
    let results: DecompositionResult[] = [];

    if (targetSessionId) {
      const decompositionIds = new Set<string>();
      const sessionMessages = messages.filter(
        (message) => message.sessionId === targetSessionId
      );

      for (const message of sessionMessages) {
        if (message.decompositionId) {
          decompositionIds.add(message.decompositionId);
        }

        const metadataDecompositionId = getMetadataDecompositionId(
          message.metadata
        );
        if (metadataDecompositionId) {
          decompositionIds.add(metadataDecompositionId);
        }
      }

      results = Array.from(decompositionIds)
        .map((decompositionId) => decompositions[decompositionId])
        .filter((result): result is DecompositionResult => Boolean(result));
    } else {
      results = Object.values(decompositions);
    }

    if (results.length === 0 && activeDecompositionId && !targetSessionId) {
      const active = decompositions[activeDecompositionId];
      if (active) {
        results = [active];
      }
    }

    return results
      .filter((result) => matchesSearch(result, search))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [
    targetSessionId,
    messages,
    decompositions,
    activeDecompositionId,
    search,
  ]);

  useEffect(() => {
    if (!targetSessionId || contextResults.length > 0 || isHydrating) {
      return;
    }

    if (hydratedSessionIdsRef.current.has(targetSessionId)) {
      return;
    }

    hydratedSessionIdsRef.current.add(targetSessionId);
    setIsHydrating(true);

    void hydrateSessionSnapshot(targetSessionId)
      .catch((error) => {
        console.error("Failed to hydrate session snapshot on contexts page", error);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [targetSessionId, contextResults.length, isHydrating]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <Brain className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Contextos</h1>
              <p className="mt-1 text-sm text-white/40">
                Contexto semantico real da sessao para orientar a trilha didatica.
              </p>
              {targetSession ? (
                <p className="mt-1 text-xs text-white/35">
                  Sessao ativa: {targetSession.title}
                </p>
              ) : null}
            </div>
          </div>

          {targetSessionId ? (
            <Link
              href={`/dashboard/chat/${targetSessionId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10 hover:text-neon-cyan"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para chat
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-neutral-900/60 px-4 py-3 backdrop-blur-xl">
        <Search className="h-4 w-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por texto, intencao ou dominio..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
        />
      </div>

      {isHydrating ? (
        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-6 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 text-sm text-white/65">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando contexto da sessao...
          </div>
        </div>
      ) : contextResults.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-6 backdrop-blur-xl">
          <p className="text-sm text-white/65">
            Nenhum contexto encontrado para esta sessao ainda.
          </p>
          <p className="mt-2 text-xs text-white/35">
            Envie uma mensagem no chat para iniciar decomposicao e delegacao de funcoes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contextResults.map((result) => (
            <div
              key={result.id}
              className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="flex-1 text-sm font-medium text-white/90">
                  &ldquo;{result.inputText}&rdquo;
                </p>
                <span className="shrink-0 text-[10px] text-white/25">
                  {new Date(result.timestamp).toLocaleString("pt-BR")}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${
                    INTENT_COLORS[result.intent.primary]
                  }`}
                >
                  <Target className="h-3 w-3" />
                  {formatIntent(result.intent.primary)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                  <Gauge className="h-3 w-3" />
                  {Math.round(result.intent.confidence * 100)}% confianca
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                  {result.tokens.length} tokens
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                  {result.taskRouting.requiredAgents.length} agentes sugeridos
                </span>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tags className="h-3 w-3 text-white/25" />
                  {result.context.domains.map((domain) => (
                    <span
                      key={`${result.id}-${domain.domain}`}
                      className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/40"
                    >
                      {domain.domain}
                    </span>
                  ))}
                </div>

                <div className="w-full max-w-60 space-y-1">
                  <PolarityBar
                    label="Complexidade"
                    value={result.polarity.complexity}
                  />
                  <PolarityBar label="Urgencia" value={result.polarity.urgency} />
                  <PolarityBar label="Certeza" value={result.polarity.certainty} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContextsPageFallback() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-6 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 text-sm text-white/65">
          <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
          Carregando contexto da sessao...
        </div>
      </div>
    </div>
  );
}

export default function ContextsPage() {
  return (
    <Suspense fallback={<ContextsPageFallback />}>
      <ContextsPageContent />
    </Suspense>
  );
}
