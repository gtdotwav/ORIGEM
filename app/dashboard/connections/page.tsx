"use client";

import { Suspense, useState, useMemo } from "react";
import { Users2, UserPlus, Link2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { ConnectionCard } from "@/components/connections/connection-card";
import { ConnectionCreateDialog } from "@/components/connections/connection-create-dialog";
import { InviteLinkDialog } from "@/components/connections/invite-link-dialog";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import { useClientMounted } from "@/hooks/use-client-mounted";
import type { Connection, ConnectionStatus } from "@/types/connection";

type TabFilter = "all" | ConnectionStatus;

function ConnectionsPageFallback() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-3 gap-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

function ConnectionsPageContent() {
  const mounted = useClientMounted();
  const connections = useConnectionStore((s) => s.connections);
  const inviteLinks = useConnectionStore((s) => s.inviteLinks);

  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editConnection, setEditConnection] = useState<Connection | null>(null);

  const counts = useMemo(
    () => ({
      all: connections.length,
      pending: connections.filter((c) => c.status === "pending").length,
      accepted: connections.filter((c) => c.status === "accepted").length,
      blocked: connections.filter((c) => c.status === "blocked").length,
    }),
    [connections]
  );

  const filtered = useMemo(() => {
    let list = connections;
    if (tab !== "all") {
      list = list.filter((c) => c.status === tab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q))
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [connections, tab, search]);

  const TABS: { value: TabFilter; label: string }[] = [
    { value: "all", label: `Todos (${counts.all})` },
    { value: "pending", label: `Pendentes (${counts.pending})` },
    { value: "accepted", label: `Aceitos (${counts.accepted})` },
    { value: "blocked", label: `Bloqueados (${counts.blocked})` },
  ];

  if (!mounted) {
    return <ConnectionsPageFallback />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10">
            <Users2 className="h-6 w-6 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground/95">Conexões</h1>
            <p className="text-sm text-foreground/40">
              Gerencie sua rede de contatos e colaboradores
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neon-purple/20 bg-neon-purple/10 px-3 py-2 text-xs font-medium text-neon-purple transition-colors hover:bg-neon-purple/15"
          >
            <Link2 className="h-3.5 w-3.5" />
            Criar convite
          </button>
          <button
            type="button"
            onClick={() => {
              setEditConnection(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-xs font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/15"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Users2 className="h-3.5 w-3.5 text-neon-cyan/60" />
            <span className="text-xs text-foreground/30">Total</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{counts.all}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5 text-neon-orange/60" />
            <span className="text-xs text-foreground/30">Pendentes</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-neon-purple/60" />
            <span className="text-xs text-foreground/30">Links ativos</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{inviteLinks.length}</p>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, função ou tag..."
            className="w-full rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] py-2.5 pl-10 pr-3 text-sm text-foreground/80 placeholder:text-foreground/25 focus:border-foreground/15 focus:outline-none"
          />
        </div>

        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                tab === t.value
                  ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                  : "border-foreground/[0.06] text-foreground/35 hover:border-foreground/15 hover:text-foreground/50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <CosmicEmptyState
          icon={Users2}
          title={connections.length === 0 ? "Nenhuma conexão" : "Nenhum resultado"}
          description={
            connections.length === 0
              ? "Adicione conexões para colaborar e compartilhar conteúdo."
              : "Tente ajustar sua busca ou filtro."
          }
          neonColor="cyan"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onEdit={(c) => {
                setEditConnection(c);
                setCreateOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ConnectionCreateDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditConnection(null);
        }}
        editConnection={editConnection}
      />
      <InviteLinkDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<ConnectionsPageFallback />}>
      <ConnectionsPageContent />
    </Suspense>
  );
}
