"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Loader2,
  LogIn,
  Plug,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// ── SVG Icons ──

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.12.83-.26.83-.57v-2.2c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.22.69.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const VercelIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 1L24 22H0L12 1z" />
  </svg>
);

const SupabaseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M13.32 21.95c-.45.56-1.38.2-1.38-.53V13.5H3.35c-.88 0-1.35-1.04-.77-1.7L10.68 2.05c.45-.56 1.38-.2 1.38.53V10.5h8.59c.88 0 1.35 1.04.77 1.7l-8.1 9.75z" />
  </svg>
);

const StripeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M13.98 11.19c0-1.57-.77-2.81-2.24-2.81-1.48 0-2.36 1.24-2.36 2.8 0 1.85 1.05 2.78 2.56 2.78.73 0 1.29-.17 1.71-.4v-1.75c-.42.21-.9.34-1.51.34-.6 0-1.13-.21-1.2-.93h3.01c.01-.08.03-.42.03-.63zM10.9 10.8c0-.69.42-1.05.87-1.05.44 0 .83.36.83 1.05H10.9zM7.44 8.38c-.6 0-.99.28-1.2.48l-.08-.38H4.56v7.84l1.88-.4.01-1.9c.22.16.54.39 1.07.39 1.08 0 2.07-.87 2.07-2.79-.01-1.76-1-2.74-2.15-2.74zm-.38 4.22c-.36 0-.57-.13-.71-.28l-.01-2.23c.16-.17.37-.3.72-.3.55 0 .93.62.93 1.4 0 .81-.37 1.41-.93 1.41zM3.38 8.02l1.89-.4V5.95l-1.89.4v1.67zM3.38 8.55h1.89v7.17H3.38V8.55zM18.82 10.21l.08-.38h-1.56v7.17h1.88v-4.86c.44-.58 1.2-.47 1.43-.39V10.1c-.24-.09-1.1-.24-1.56.47l-.27-.36zM21.5 6.35l-1.87.4v6.56c0 1.21.91 2.1 2.12 2.1.67 0 1.16-.12 1.43-.27v-1.52c-.26.1-1.55.47-1.55-.71v-2.84h1.55V8.55h-1.55l-.13-2.2z" />
  </svg>
);

const FigmaIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M15.85 0H8.15A3.15 3.15 0 0 0 5 3.15 3.15 3.15 0 0 0 6.88 6 3.15 3.15 0 0 0 5 8.85 3.15 3.15 0 0 0 6.88 11.7 3.15 3.15 0 0 0 5 14.55a3.15 3.15 0 0 0 3.15 3.15h.13A3.28 3.28 0 0 0 11.5 21a3.28 3.28 0 0 0 3.22-3.3v-2.82c.3.1.63.15.98.15h.15A3.15 3.15 0 0 0 19 11.88a3.15 3.15 0 0 0-1.88-2.88A3.15 3.15 0 0 0 19 6.15 3.15 3.15 0 0 0 15.85 3V0zM8.15 1.5h3.35v3.15H8.15A1.65 1.65 0 0 1 6.5 3.15 1.65 1.65 0 0 1 8.15 1.5zm0 4.65h3.35v3.35H8.15a1.68 1.68 0 0 1 0-3.35zm0 8.05a1.68 1.68 0 0 1 0-3.35h3.35v1.68A1.68 1.68 0 0 1 8.15 14.2zm3.35 3.5a1.78 1.78 0 0 1-1.72 1.8 1.65 1.65 0 0 1-1.63-1.65 1.65 1.65 0 0 1 1.63-1.65h1.72V17.7zm4.35-5.82h-.15a1.68 1.68 0 0 1 0-3.35h.15a1.68 1.68 0 0 1 0 3.35zm0-4.85h-.15a1.68 1.68 0 0 1 0-3.35h.15a1.68 1.68 0 0 1 0 3.35z" />
  </svg>
);

// ── Types ──

interface GitHubData {
  connected: boolean;
  user?: { login: string; avatar_url: string; name: string | null };
  repos?: Array<{ name: string; full_name: string; html_url: string; language: string | null; stargazers_count: number }>;
  activity?: Array<{ type: string; repo: string; created_at: string; title: string }>;
}

interface VercelData {
  connected: boolean;
  project?: { name: string; framework: string; domains: string[] };
  deployments?: Array<{ id: string; state: string; url: string; createdAt: string; commitMessage: string; target: string }>;
}

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FUTURE_CONNECTORS: Connector[] = [
  { id: "supabase", name: "Supabase", description: "Database, Auth, Storage", icon: <SupabaseIcon />, color: "text-emerald-400" },
  { id: "stripe", name: "Stripe", description: "Pagamentos, Subscricoes", icon: <StripeIcon />, color: "text-violet-400" },
  { id: "figma", name: "Figma", description: "Design, Prototipos", icon: <FigmaIcon />, color: "text-pink-400" },
];

// ── Helpers ──

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PushEvent: GitCommit,
  PullRequestEvent: GitPullRequest,
  CreateEvent: GitBranch,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const STATE_COLORS: Record<string, string> = {
  READY: "bg-neon-green shadow-[0_0_4px_rgba(0,200,0,0.4)]",
  BUILDING: "bg-yellow-400 animate-pulse",
  ERROR: "bg-red-400",
  CANCELED: "bg-foreground/30",
};

// ── Component ──

interface ConnectorsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectorsPanel({ open, onClose }: ConnectorsPanelProps) {
  const [github, setGithub] = useState<GitHubData | null>(null);
  const [vercel, setVercel] = useState<VercelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [ghRes, vcRes] = await Promise.allSettled([
      fetch("/api/integrations/github").then((r) => r.json()),
      fetch("/api/integrations/vercel").then((r) => r.json()),
    ]);
    setGithub(ghRes.status === "fulfilled" ? ghRes.value : { connected: false });
    setVercel(vcRes.status === "fulfilled" ? vcRes.value : { connected: false });
    setLoading(false);
  };

  useEffect(() => {
    if (open) void fetchAll();
  }, [open]);

  const connectedCount =
    (github?.connected ? 1 : 0) + (vercel?.connected ? 1 : 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[55]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed left-12 top-1/2 z-[60] -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            <div
              className="relative flex max-h-[88vh] w-96 flex-col overflow-hidden rounded-2xl border border-foreground/[0.15] shadow-2xl shadow-black/50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              {/* Header */}
              <div className="flex shrink-0 items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Plug className="h-3.5 w-3.5 text-neon-cyan/60" />
                  <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
                    CONECTORES
                  </span>
                  {connectedCount > 0 && (
                    <span className="rounded-md bg-neon-green/20 px-1.5 py-0.5 text-[9px] tabular-nums font-semibold text-neon-green">
                      {connectedCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void fetchAll()}
                    disabled={loading}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/40 transition-all hover:border-foreground/[0.10] hover:bg-foreground/[0.08] hover:text-neon-cyan disabled:opacity-30"
                  >
                    <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/40 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto py-2">
                {loading ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-neon-cyan/40" />
                    <p className="mt-2 text-[11px] text-foreground/45">Verificando conexoes...</p>
                  </div>
                ) : (
                  <div className="space-y-0.5 px-2">
                    {/* ── GitHub ── */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expandedSection === "github" ? null : "github")}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
                          github?.connected
                            ? "bg-foreground/[0.06] text-foreground/90 hover:bg-foreground/[0.08]"
                            : "text-foreground/60 hover:bg-foreground/[0.04]"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          github?.connected ? "bg-foreground/[0.10]" : "bg-foreground/[0.05]"
                        )}>
                          <span className={github?.connected ? "text-foreground/90" : "text-foreground/40"}>
                            <GitHubIcon />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold leading-tight text-foreground/90">
                            GitHub
                            {github?.user && (
                              <span className="ml-1.5 text-[10px] font-normal text-foreground/45">
                                @{github.user.login}
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-foreground/40">
                            {github?.connected
                              ? `${github.repos?.length ?? 0} repos sincronizados`
                              : "Conectar via GitHub OAuth"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {github?.connected && (
                            <Circle className="h-2 w-2 fill-neon-green text-neon-green" />
                          )}
                          <ChevronRight className={cn(
                            "h-3.5 w-3.5 text-foreground/30 transition-transform",
                            expandedSection === "github" && "rotate-90"
                          )} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedSection === "github" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-2 pb-2 pt-1">
                              {github?.connected ? (
                                <>
                                  {/* Recent activity */}
                                  {github.activity && github.activity.length > 0 && (
                                    <div className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] p-2.5">
                                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                                        Atividade recente
                                      </p>
                                      <div className="space-y-1.5">
                                        {github.activity.slice(0, 6).map((event, i) => {
                                          const Icon = EVENT_ICONS[event.type] ?? GitCommit;
                                          return (
                                            <div key={i} className="flex items-start gap-2">
                                              <Icon className="mt-0.5 h-3 w-3 shrink-0 text-neon-cyan/50" />
                                              <div className="min-w-0 flex-1">
                                                <p className="truncate text-[11px] text-foreground/70">
                                                  {event.title}
                                                </p>
                                                <p className="text-[10px] text-foreground/35">
                                                  {event.repo.split("/").pop()} · {timeAgo(event.created_at)}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Top repos */}
                                  {github.repos && github.repos.length > 0 && (
                                    <div className="mt-1.5 rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] p-2.5">
                                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                                        Repositorios
                                      </p>
                                      <div className="space-y-1">
                                        {github.repos.slice(0, 5).map((repo) => (
                                          <a
                                            key={repo.full_name}
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-foreground/[0.06]"
                                          >
                                            <span className="truncate text-[11px] font-medium text-foreground/65">
                                              {repo.name}
                                            </span>
                                            {repo.language && (
                                              <span className="shrink-0 rounded bg-foreground/[0.06] px-1 py-0.5 text-[9px] text-foreground/40">
                                                {repo.language}
                                              </span>
                                            )}
                                            <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-foreground/25" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] p-3">
                                  <p className="mb-3 text-[11px] leading-relaxed text-foreground/55">
                                    Reconecte via GitHub para autorizar acesso a repos e atividade.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void signIn("github")}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2.5 text-[12px] font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 hover:text-neon-cyan"
                                  >
                                    <LogIn className="h-4 w-4" />
                                    Conectar GitHub
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── Vercel ── */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expandedSection === "vercel" ? null : "vercel")}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
                          vercel?.connected
                            ? "bg-foreground/[0.06] text-foreground/90 hover:bg-foreground/[0.08]"
                            : "text-foreground/60 hover:bg-foreground/[0.04]"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          vercel?.connected ? "bg-foreground/[0.10]" : "bg-foreground/[0.05]"
                        )}>
                          <span className={vercel?.connected ? "text-foreground/90" : "text-foreground/40"}>
                            <VercelIcon />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold leading-tight text-foreground/90">
                            Vercel
                          </p>
                          <p className="truncate text-[11px] text-foreground/40">
                            {vercel?.connected
                              ? vercel.project?.domains?.join(", ") ?? "Conectado"
                              : "VERCEL_API_TOKEN nao configurado"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {vercel?.connected && (
                            <Circle className="h-2 w-2 fill-neon-green text-neon-green" />
                          )}
                          <ChevronRight className={cn(
                            "h-3.5 w-3.5 text-foreground/30 transition-transform",
                            expandedSection === "vercel" && "rotate-90"
                          )} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedSection === "vercel" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-2 pb-2 pt-1">
                              {vercel?.connected ? (
                                vercel.deployments && vercel.deployments.length > 0 && (
                                  <div className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] p-2.5">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                                      Deployments recentes
                                    </p>
                                    <div className="space-y-2">
                                      {vercel.deployments.slice(0, 5).map((d) => (
                                        <div key={d.id} className="flex items-start gap-2">
                                          <div className={cn(
                                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                                            STATE_COLORS[d.state] ?? "bg-foreground/30"
                                          )} />
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] text-foreground/70">
                                              {d.commitMessage || d.id}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-medium text-foreground/35">
                                                {d.target}
                                              </span>
                                              <span className="text-[10px] text-foreground/25">
                                                {timeAgo(d.createdAt)}
                                              </span>
                                            </div>
                                          </div>
                                          <Rocket className="mt-0.5 h-3 w-3 shrink-0 text-foreground/20" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] p-3">
                                  <p className="text-[11px] leading-relaxed text-foreground/55">
                                    Configure <code className="rounded bg-foreground/[0.10] px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">VERCEL_API_TOKEN</code> nas variaveis de ambiente do Vercel para conectar.
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── Divider ── */}
                    <div className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                      Em breve
                    </p>

                    {/* ── Future Connectors ── */}
                    {FUTURE_CONNECTORS.map((connector) => (
                      <div
                        key={connector.id}
                        className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                          <span className={cn("opacity-40", connector.color)}>{connector.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-tight text-foreground/50">
                            {connector.name}
                          </p>
                          <p className="truncate text-[11px] text-foreground/30">
                            {connector.description}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md border border-foreground/[0.10] bg-foreground/[0.04] px-2 py-0.5 text-[9px] font-medium text-foreground/35">
                          Soon
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
