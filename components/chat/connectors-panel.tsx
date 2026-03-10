"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  CreditCard,
  Database,
  ExternalLink,
  Folder,
  GitBranch,
  Loader2,
  MessageSquare,
  Plug,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMCPStore } from "@/stores/mcp-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type {
  MCPAuthRequirement,
  MCPConnector,
  MCPServerDefinition,
} from "@/types/mcp";

interface ConnectorsPanelProps {
  open: boolean;
  onClose: () => void;
  currentSessionId?: string;
}

const SERVER_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  database: Database,
  "git-branch": GitBranch,
  folder: Folder,
  "message-square": MessageSquare,
  "book-open": BookOpen,
  "credit-card": CreditCard,
};

function toInputType(requirement: MCPAuthRequirement) {
  return requirement.type === "url" ? "url" : "password";
}

function createInitialFields(server: MCPServerDefinition) {
  return Object.fromEntries(
    server.requiredAuth.map((requirement) => [requirement.key, ""]),
  ) as Record<string, string>;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string; reason?: string; details?: string })
    | null;

  if (!response.ok) {
    const detail =
      payload?.reason || payload?.details || payload?.error || `request_failed_${response.status}`;
    throw new Error(detail);
  }

  return (payload ?? {}) as T;
}

function trimCredentialPayload(credentials: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(credentials)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0),
  );
}

function StatusBadge({ connector }: { connector?: MCPConnector }) {
  if (!connector) {
    return (
      <span className="rounded-full border border-foreground/[0.08] bg-foreground/[0.05] px-2 py-0.5 text-[10px] font-medium text-foreground/45">
        Disponivel
      </span>
    );
  }

  const styles =
    connector.status === "connected"
      ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-300"
      : connector.status === "error"
      ? "border-red-500/20 bg-red-500/12 text-red-300"
      : connector.status === "connecting"
      ? "border-amber-500/20 bg-amber-500/12 text-amber-200"
      : "border-foreground/[0.10] bg-foreground/[0.06] text-foreground/55";

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", styles)}>
      {connector.status}
    </span>
  );
}

export function ConnectorsPanel({
  open,
  onClose,
  currentSessionId,
}: ConnectorsPanelProps) {
  const sessions = useSessionStore((state) => state.sessions);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setWorkspaceMCPConnectorIds = useWorkspaceStore(
    (state) => state.setWorkspaceMCPConnectorIds,
  );

  const registry = useMCPStore((state) => state.registry);
  const connectors = useMCPStore((state) => state.connectors);
  const setRegistry = useMCPStore((state) => state.setRegistry);
  const setConnectors = useMCPStore((state) => state.setConnectors);

  const [loading, setLoading] = useState(false);
  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [credentialForms, setCredentialForms] = useState<
    Record<string, Record<string, string>>
  >({});

  const currentSession = useMemo(
    () =>
      currentSessionId
        ? sessions.find((session) => session.id === currentSessionId)
        : undefined,
    [currentSessionId, sessions],
  );

  const sessionWorkspaceId = useMemo(() => {
    if (!currentSession) {
      return undefined;
    }

    if (typeof currentSession.workspaceId === "string" && currentSession.workspaceId.length > 0) {
      return currentSession.workspaceId;
    }

    const metadataWorkspaceId = currentSession.metadata?.workspaceId;
    return typeof metadataWorkspaceId === "string" && metadataWorkspaceId.length > 0
      ? metadataWorkspaceId
      : undefined;
  }, [currentSession]);

  const effectiveWorkspaceId = sessionWorkspaceId ?? activeWorkspaceId ?? null;

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === effectiveWorkspaceId),
    [workspaces, effectiveWorkspaceId],
  );

  const workspaceConnectors = useMemo(
    () =>
      connectors.filter((connector) => connector.workspaceId === effectiveWorkspaceId),
    [connectors, effectiveWorkspaceId],
  );

  const installedByServerId = useMemo(
    () =>
      new Map(workspaceConnectors.map((connector) => [connector.serverId, connector])),
    [workspaceConnectors],
  );

  const orderedRegistry = useMemo(
    () => [...registry].sort((left, right) => left.name.localeCompare(right.name)),
    [registry],
  );

  useEffect(() => {
    if (!effectiveWorkspaceId) return;
    setWorkspaceMCPConnectorIds(
      effectiveWorkspaceId,
      workspaceConnectors.map((connector) => connector.id),
    );
  }, [effectiveWorkspaceId, setWorkspaceMCPConnectorIds, workspaceConnectors]);

  useEffect(() => {
    if (registry.length === 0) return;

    setCredentialForms((current) => {
      const next = { ...current };
      for (const server of registry) {
        next[server.id] = next[server.id] ?? createInitialFields(server);
      }
      return next;
    });
  }, [registry]);

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      const registryResponse = await fetch("/api/mcp/registry", { cache: "no-store" });
      const registryPayload = await parseApiResponse<{ servers: MCPServerDefinition[] }>(
        registryResponse,
      );
      setRegistry(registryPayload.servers);

      if (!effectiveWorkspaceId) {
        setConnectors([]);
        return;
      }

      const statusResponse = await fetch(
        `/api/mcp/status?workspaceId=${encodeURIComponent(effectiveWorkspaceId)}`,
        { cache: "no-store" },
      );
      const statusPayload = await parseApiResponse<{ connectors: MCPConnector[] }>(
        statusResponse,
      );
      setConnectors(statusPayload.connectors);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Falha ao carregar conectores.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }, [effectiveWorkspaceId, setConnectors, setRegistry]);

  useEffect(() => {
    if (!open) return;
    void refreshData();
  }, [open, refreshData]);

  const updateCredential = (serverId: string, key: string, value: string) => {
    setCredentialForms((current) => ({
      ...current,
      [serverId]: {
        ...(current[serverId] ?? {}),
        [key]: value,
      },
    }));
  };

  const handleConnect = async (server: MCPServerDefinition) => {
    if (!effectiveWorkspaceId) {
      toast.error("Selecione um Workspace antes de instalar conectores MCP.");
      return;
    }

    const credentials = trimCredentialPayload(credentialForms[server.id] ?? {});

    setWorkingKey(`connect:${server.id}`);

    try {
      const response = await fetch("/api/mcp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: effectiveWorkspaceId,
          serverId: server.id,
          credentials,
        }),
      });

      await parseApiResponse<{ ok: true }>(response);
      toast.success(`${server.name} conectado.`);
      setExpandedServerId(server.id);
      await refreshData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Falha ao conectar.";
      toast.error(detail);
    } finally {
      setWorkingKey(null);
    }
  };

  const handleDisconnect = async (connector: MCPConnector) => {
    setWorkingKey(`disconnect:${connector.id}`);

    try {
      const response = await fetch("/api/mcp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id }),
      });

      await parseApiResponse<{ ok: true }>(response);
      toast.success(`${connector.serverName} removido.`);
      await refreshData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Falha ao desconectar.";
      toast.error(detail);
    } finally {
      setWorkingKey(null);
    }
  };

  const handleTest = async (connector: MCPConnector) => {
    setWorkingKey(`test:${connector.id}`);

    try {
      const response = await fetch("/api/mcp/auth/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id }),
      });

      await parseApiResponse<{ ok: true }>(response);
      toast.success(`${connector.serverName} respondeu ao teste de saude.`);
      await refreshData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Falha no health check.";
      toast.error(detail);
    } finally {
      setWorkingKey(null);
    }
  };

  const handleDiscover = async (connector: MCPConnector) => {
    setWorkingKey(`discover:${connector.id}`);

    try {
      const response = await fetch("/api/mcp/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id }),
      });

      await parseApiResponse<{ ok: true }>(response);
      toast.success(`Ferramentas de ${connector.serverName} atualizadas.`);
      await refreshData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Falha ao redescobrir ferramentas.";
      toast.error(detail);
    } finally {
      setWorkingKey(null);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[55]"
            onClick={onClose}
          />

          <motion.aside
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.3rem)] z-[60] md:inset-x-auto md:bottom-auto md:left-12 md:top-1/2 md:-translate-y-1/2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            <div
              className="relative flex max-h-[70vh] w-full flex-col overflow-hidden rounded-2xl border border-foreground/[0.15] shadow-2xl shadow-black/50 md:max-h-[88vh] md:w-[27rem]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              <div className="flex shrink-0 items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Plug className="h-3.5 w-3.5 text-neon-cyan/70" />
                  <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
                    MCP CONNECTORS
                  </span>
                  {workspaceConnectors.length > 0 ? (
                    <span className="rounded-md bg-neon-green/20 px-1.5 py-0.5 text-[9px] font-semibold text-neon-green">
                      {workspaceConnectors.length}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void refreshData()}
                    disabled={loading}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/40 transition-all hover:border-foreground/[0.10] hover:bg-foreground/[0.08] hover:text-neon-cyan disabled:opacity-30"
                    aria-label="Atualizar conectores MCP"
                  >
                    <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/40 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Fechar painel MCP"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="mb-3 rounded-2xl border border-neon-cyan/15 bg-neon-cyan/10 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-neon-cyan" />
                    <p className="text-xs font-medium text-foreground/80">
                      {activeWorkspace
                        ? `${sessionWorkspaceId ? "Workspace da sessao" : "Workspace ativo"}: ${activeWorkspace.name}`
                        : "Nenhum Workspace selecionado"}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-foreground/50">
                    {sessionWorkspaceId
                      ? "O chat usa os conectores instalados no workspace associado a esta sessao."
                      : "O chat usa os conectores instalados no workspace ativo para executar ferramentas MCP."}
                  </p>
                </div>

                {!activeWorkspace ? (
                  <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-200" />
                      <div>
                        <p className="text-sm font-medium text-amber-100">
                          Selecione um Workspace para continuar.
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-amber-100/75">
                          Os conectores MCP sao instalados por Workspace. Associe esta sessao a um workspace ou ative um workspace antes de conectar ferramentas.
                        </p>
                        <Link
                          href="/dashboard/workspaces"
                          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-medium text-amber-50 transition-all hover:bg-amber-200/15"
                        >
                          Abrir Workspaces
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : loading && registry.length === 0 ? (
                  <div className="flex flex-col items-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-neon-cyan/40" />
                    <p className="mt-2 text-[11px] text-foreground/45">
                      Carregando catalogo MCP...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderedRegistry.map((server) => {
                      const connector = installedByServerId.get(server.id);
                      const Icon = SERVER_ICONS[server.icon] ?? Plug;
                      const isExpanded =
                        expandedServerId === server.id || Boolean(connector?.error);
                      const formValues =
                        credentialForms[server.id] ?? createInitialFields(server);

                      return (
                        <div
                          key={server.id}
                          className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] p-3"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedServerId((current) =>
                                current === server.id ? null : server.id,
                              )
                            }
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.06]">
                              <Icon className="h-4 w-4 text-foreground/75" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground/88">
                                  {server.name}
                                </p>
                                <StatusBadge connector={connector} />
                                <span className="rounded-full border border-foreground/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/35">
                                  {server.category}
                                </span>
                              </div>

                              <p className="mt-1 text-[11px] leading-5 text-foreground/45">
                                {server.description}
                              </p>

                              {connector ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground/45">
                                  <span>{connector.tools.length} ferramentas</span>
                                  {connector.lastHealthCheck ? (
                                    <span>
                                      Ultimo check:{" "}
                                      {new Date(connector.lastHealthCheck).toLocaleTimeString(
                                        "pt-BR",
                                        { hour: "2-digit", minute: "2-digit" },
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </button>

                          {connector?.error ? (
                            <div className="mt-3 rounded-xl border border-red-500/15 bg-red-500/10 px-3 py-2 text-[11px] text-red-200/90">
                              {connector.error}
                            </div>
                          ) : null}

                          {isExpanded ? (
                            <div className="mt-3 space-y-3">
                              {server.requiredAuth.length > 0 && !connector ? (
                                <div className="space-y-2">
                                  {server.requiredAuth.map((requirement) => (
                                    <label key={requirement.key} className="block">
                                      <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-medium text-foreground/70">
                                          {requirement.label}
                                        </span>
                                        {!requirement.required ? (
                                          <span className="text-[10px] text-foreground/35">
                                            opcional
                                          </span>
                                        ) : null}
                                      </div>
                                      <input
                                        type={toInputType(requirement)}
                                        value={formValues[requirement.key] ?? ""}
                                        placeholder={requirement.placeholder}
                                        onChange={(event) =>
                                          updateCredential(
                                            server.id,
                                            requirement.key,
                                            event.target.value,
                                          )
                                        }
                                        className="w-full rounded-xl border border-foreground/[0.10] bg-black/20 px-3 py-2 text-xs text-foreground outline-none transition-all placeholder:text-foreground/25 focus:border-neon-cyan/35"
                                      />
                                      <p className="mt-1 text-[10px] leading-4 text-foreground/35">
                                        {requirement.description}
                                      </p>
                                    </label>
                                  ))}
                                </div>
                              ) : null}

                              {server.documentationUrl ? (
                                <Link
                                  href={server.documentationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-neon-cyan/80 transition-colors hover:text-neon-cyan"
                                >
                                  Documentacao oficial
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : null}

                              {connector?.tools.length ? (
                                <div className="rounded-xl border border-foreground/[0.06] bg-black/10 p-2.5">
                                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/35">
                                    Ferramentas
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {connector.tools.slice(0, 8).map((tool) => (
                                      <span
                                        key={tool.name}
                                        className="rounded-full border border-foreground/[0.06] bg-foreground/[0.05] px-2 py-1 text-[10px] text-foreground/55"
                                      >
                                        {tool.name}
                                      </span>
                                    ))}
                                    {connector.tools.length > 8 ? (
                                      <span className="rounded-full border border-foreground/[0.06] bg-foreground/[0.05] px-2 py-1 text-[10px] text-foreground/35">
                                        +{connector.tools.length - 8}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex flex-wrap gap-2">
                                {connector ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleTest(connector)}
                                      disabled={workingKey === `test:${connector.id}`}
                                      className="inline-flex items-center gap-1 rounded-xl border border-foreground/[0.10] bg-foreground/[0.06] px-3 py-2 text-xs font-medium text-foreground/65 transition-all hover:border-neon-cyan/30 hover:text-neon-cyan disabled:opacity-40"
                                    >
                                      {workingKey === `test:${connector.id}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                      )}
                                      Testar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDiscover(connector)}
                                      disabled={workingKey === `discover:${connector.id}`}
                                      className="inline-flex items-center gap-1 rounded-xl border border-foreground/[0.10] bg-foreground/[0.06] px-3 py-2 text-xs font-medium text-foreground/65 transition-all hover:border-neon-cyan/30 hover:text-neon-cyan disabled:opacity-40"
                                    >
                                      {workingKey === `discover:${connector.id}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      )}
                                      Ferramentas
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDisconnect(connector)}
                                      disabled={workingKey === `disconnect:${connector.id}`}
                                      className="inline-flex items-center gap-1 rounded-xl border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition-all hover:border-red-500/25 hover:bg-red-500/15 disabled:opacity-40"
                                    >
                                      {workingKey === `disconnect:${connector.id}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Unplug className="h-3.5 w-3.5" />
                                      )}
                                      Remover
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => void handleConnect(server)}
                                    disabled={workingKey === `connect:${server.id}`}
                                    className="inline-flex items-center gap-1 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/45 hover:bg-neon-cyan/15 disabled:opacity-40"
                                  >
                                    {workingKey === `connect:${server.id}` ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Plug className="h-3.5 w-3.5" />
                                    )}
                                    Conectar
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
