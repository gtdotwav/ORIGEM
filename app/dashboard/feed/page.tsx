"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Rss, Heart, Newspaper, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFeedStore } from "@/stores/feed-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectStore } from "@/stores/project-store";
import { useSessionStore } from "@/stores/session-store";
import { FeedSearchBar } from "@/components/feed/feed-search-bar";
import { FeedCard } from "@/components/feed/feed-card";
import { ShareDialog } from "@/components/feed/share-dialog";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import type { FeedItem } from "@/types/feed";
import { DEFAULT_FEED_QUERY, buildFeedContextFromWorkspace } from "@/lib/feed/context";

function FeedPageFallback() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-3 gap-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

function FeedPageContent() {
  const items = useFeedStore((s) => s.items);
  const interactions = useFeedStore((s) => s.interactions);
  const searchQuery = useFeedStore((s) => s.searchQuery);
  const activeFilter = useFeedStore((s) => s.activeFilter);
  const isLoading = useFeedStore((s) => s.isLoading);
  const error = useFeedStore((s) => s.error);
  const lastFetchedAt = useFeedStore((s) => s.lastFetchedAt);
  const context = useFeedStore((s) => s.context);
  const setLiveResults = useFeedStore((s) => s.setLiveResults);
  const setLoading = useFeedStore((s) => s.setLoading);
  const setError = useFeedStore((s) => s.setError);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useProjectStore((s) => s.projects);
  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages);

  const [shareItem, setShareItem] = useState<FeedItem | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const requestIdRef = useRef(0);

  const workspaceContext = useMemo(
    () =>
      buildFeedContextFromWorkspace({
        activeWorkspaceId,
        workspaces,
        projects,
        sessions,
        messages,
      }),
    [activeWorkspaceId, messages, projects, sessions, workspaces]
  );

  const effectiveQuery = useMemo(() => {
    const manualQuery = searchQuery.trim();
    if (manualQuery) {
      return manualQuery;
    }

    if (workspaceContext.topics.length > 0) {
      return workspaceContext.topics.slice(0, 5).join(" ");
    }

    return DEFAULT_FEED_QUERY;
  }, [searchQuery, workspaceContext.topics]);

  const effectiveContext = useMemo(() => {
    const manualQuery = searchQuery.trim();

    if (manualQuery) {
      return {
        mode: "manual" as const,
        label: manualQuery,
        reason:
          workspaceContext.mode === "workspace"
            ? `Busca manual com apoio do workspace ${workspaceContext.label ?? "ativo"}.`
            : "Busca manual baseada no tema digitado.",
        topics: [
          manualQuery,
          ...workspaceContext.topics,
        ].filter((topic, index, array) => array.indexOf(topic) === index).slice(0, 6),
        ...(workspaceContext.workspaceId
          ? {
              workspaceId: workspaceContext.workspaceId,
              workspaceName: workspaceContext.workspaceName,
            }
          : {}),
      };
    }

    if (workspaceContext.mode === "workspace") {
      return workspaceContext;
    }

    return {
      mode: "default" as const,
      label: "Descoberta geral",
      reason: "Sem workspace ativo. Mostrando um recorte amplo e atual do ecossistema.",
      topics: [],
    };
  }, [searchQuery, workspaceContext]);

  useEffect(() => {
    const query = effectiveQuery.trim();
    if (!query) {
      return;
    }

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    fetch("/api/feed/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query,
        mode: effectiveContext.mode,
        label: effectiveContext.label,
        reason: effectiveContext.reason,
        topics: effectiveContext.topics,
        workspaceId: effectiveContext.workspaceId,
        workspaceName: effectiveContext.workspaceName,
        limit: 10,
      }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`feed_request_failed:${response.status}`);
        }

        return response.json() as Promise<{
          items: FeedItem[];
          resolvedQuery: string;
          fetchedAt: string;
          context: typeof effectiveContext;
        }>;
      })
      .then((payload) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setLiveResults(payload);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        console.error("[feed] Failed to load live feed:", fetchError);
        setError(
          "Nao foi possivel atualizar o feed em tempo real agora. Tente novamente em instantes."
        );
      });

    return () => controller.abort();
  }, [effectiveContext, effectiveQuery, refreshTick, setError, setLiveResults, setLoading]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === activeFilter);
    }

    return [...filtered].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() ||
        (b.relevance ?? 0) - (a.relevance ?? 0)
    );
  }, [activeFilter, items]);

  // Metrics
  const totalLikes = interactions.filter((i) => i.type === "like").length;
  const relatedTopicsCount = context.topics.length;
  const freshnessLabel = lastFetchedAt
    ? formatDistanceToNow(new Date(lastFetchedAt), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  function handleShare(item: FeedItem) {
    setShareItem(item);
    setShareOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neon-blue/10 border border-neon-blue/20">
          <Rss className="h-6 w-6 text-neon-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground/95">Feed</h1>
          <p className="text-sm text-foreground/40">
            Descoberta ao vivo por tema, workspace e contexto de conversa
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshTick((value) => value + 1)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-xs font-medium text-foreground/60 transition-all hover:border-foreground/[0.14] hover:bg-foreground/[0.05]"
        >
          <RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          Atualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-neon-cyan/60" />
            <span className="text-xs text-foreground/30">Total</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{items.length}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-pink-400/60" />
            <span className="text-xs text-foreground/30">Curtidas</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{totalLikes}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-neon-cyan/60" />
            <span className="text-xs text-foreground/30">Contexto</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{relatedTopicsCount}</p>
          <p className="mt-0.5 text-[10px] text-foreground/25">
            {freshnessLabel ? `Atualizado ${freshnessLabel}` : "Aguardando primeira busca"}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <FeedSearchBar />

      <div className="rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-neon-blue/20 bg-neon-blue/10 px-2.5 py-1 text-neon-blue">
            {context.mode === "manual"
              ? "Busca manual"
              : context.mode === "workspace"
                ? `Workspace ${context.label ?? ""}`.trim()
                : "Descoberta geral"}
          </span>
          <span className="text-foreground/45">
            {context.reason ??
              "Escreva um tema para puxar resultados em tempo real."}
          </span>
        </div>
      </div>

      {/* Feed grid */}
      {error ? (
        <CosmicEmptyState
          icon={AlertCircle}
          title="Nao foi possivel atualizar o feed"
          description={error}
          neonColor="orange"
          action={{
            label: "Tentar novamente",
            onClick: () => setRefreshTick((value) => value + 1),
          }}
        />
      ) : null}

      {isLoading && items.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}

      {!isLoading && !error && filteredItems.length === 0 ? (
        <CosmicEmptyState
          icon={Rss}
          title="Nenhum item encontrado"
          description={
            searchQuery
              ? "Tente ajustar o tema digitado ou troque o filtro de tipo."
              : "Sem resultados para o contexto atual. Tente atualizar ou escrever um tema mais específico."
          }
          neonColor="blue"
          action={{
            label: "Atualizar agora",
            onClick: () => setRefreshTick((value) => value + 1),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <FeedCard key={item.id} item={item} onShare={handleShare} />
          ))}
        </div>
      )}

      {/* Share dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        item={shareItem}
      />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedPageFallback />}>
      <FeedPageContent />
    </Suspense>
  );
}
