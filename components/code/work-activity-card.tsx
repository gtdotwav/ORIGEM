"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronDown,
  FileCode2,
  Loader2,
  ScanSearch,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityStepState = "pending" | "active" | "done";

interface ActivityStep {
  id: string;
  label: string;
  state: ActivityStepState;
}

interface FileChangeSummary {
  path: string;
  status: "created" | "updated";
  addedLines: number;
  removedLines: number;
}

interface WorkActivity {
  summary: string;
  status: "streaming" | "complete" | "error";
  startedAt: number;
  finishedAt?: number;
  steps: ActivityStep[];
  reads: string[];
  searches: string[];
  changes: FileChangeSummary[];
}

interface WorkActivityCardProps {
  activity: WorkActivity;
  onOpenFile?: (path: string) => void;
}

function formatDuration(startedAt: number, finishedAt?: number) {
  const elapsedMs = Math.max(0, (finishedAt ?? Date.now()) - startedAt);
  const seconds = Math.round(elapsedMs / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function buildFocusLabel(activity: WorkActivity) {
  const parts: string[] = [];

  if (activity.reads.length > 0) {
    parts.push(
      `${activity.reads.length} ${activity.reads.length === 1 ? "arquivo" : "arquivos"}`
    );
  }

  if (activity.searches.length > 0) {
    parts.push(
      `${activity.searches.length} ${activity.searches.length === 1 ? "busca" : "buscas"}`
    );
  }

  if (parts.length === 0 && activity.steps.length > 0) {
    parts.push(
      `${activity.steps.length} ${activity.steps.length === 1 ? "etapa" : "etapas"}`
    );
  }

  return parts.length > 0 ? `Explorando ${parts.join(", ")}` : null;
}

export function WorkActivityCard({
  activity,
  onOpenFile,
}: WorkActivityCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(
    activity.status === "streaming" ||
      activity.reads.length > 0 ||
      activity.searches.length > 0
  );

  const totals = useMemo(() => {
    return activity.changes.reduce(
      (acc, change) => {
        acc.added += change.addedLines;
        acc.removed += change.removedLines;
        return acc;
      },
      { added: 0, removed: 0 }
    );
  }, [activity.changes]);

  const focusLabel = buildFocusLabel(activity);

  return (
    <div className="mt-3 space-y-2.5">
      <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setDetailsOpen((value) => !value)}
          className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border",
              activity.status === "streaming"
                ? "border-neon-cyan/25 bg-neon-cyan/[0.08] text-neon-cyan/80"
                : activity.status === "error"
                  ? "border-neon-orange/25 bg-neon-orange/[0.08] text-neon-orange/80"
                  : "border-white/[0.08] bg-white/[0.04] text-white/50"
            )}
          >
            {activity.status === "streaming" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-medium leading-5 text-white/82">
                {activity.summary}
              </p>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-white/30 transition-transform",
                  detailsOpen && "rotate-180"
                )}
              />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/34">
              {focusLabel ? <span>{focusLabel}</span> : null}
              <span>
                {activity.status === "streaming" ? "Em andamento" : "Concluido em"}{" "}
                {formatDuration(activity.startedAt, activity.finishedAt)}
              </span>
              {activity.changes.length > 0 ? (
                <span>
                  {activity.changes.length}{" "}
                  {activity.changes.length === 1
                    ? "arquivo alterado"
                    : "arquivos alterados"}
                </span>
              ) : null}
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {detailsOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/[0.06] px-3.5 pb-3.5 pt-2">
                <div className="space-y-1.5">
                  {activity.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 text-[11px] text-white/46"
                    >
                      <span
                        className={cn(
                          "inline-flex h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                          step.state === "done"
                            ? "bg-white/50"
                            : step.state === "active"
                              ? "bg-neon-cyan/80 shadow-[0_0_12px_oklch(0.78_0.15_195/0.35)]"
                              : "bg-white/18"
                        )}
                      />
                      <span
                        className={cn(
                          step.state === "active" && "text-white/72",
                          step.state === "done" && "text-white/56"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {activity.reads.length > 0 || activity.searches.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                    {focusLabel ? (
                      <p className="mb-2 text-[11px] font-medium text-white/44">
                        {focusLabel}
                      </p>
                    ) : null}

                    <div className="space-y-1.5">
                      {activity.reads.map((path) => (
                        <div
                          key={`read:${path}`}
                          className="flex items-center gap-2 text-[11px] text-white/42"
                        >
                          <ScanSearch className="h-3.5 w-3.5 shrink-0 text-white/26" />
                          <span className="truncate">Read {path}</span>
                        </div>
                      ))}

                      {activity.searches.map((term) => (
                        <div
                          key={`search:${term}`}
                          className="flex items-center gap-2 text-[11px] text-white/42"
                        >
                          <Search className="h-3.5 w-3.5 shrink-0 text-white/26" />
                          <span className="truncate">Search {term}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {activity.changes.length > 0 ? (
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/78">
                {activity.changes.length}{" "}
                {activity.changes.length === 1
                  ? "arquivo alterado"
                  : "arquivos alterados"}
              </p>
              <p className="mt-0.5 text-[10px] text-white/34">
                +{totals.added} -{totals.removed}
              </p>
            </div>
            <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/52">
              Revisar alteracoes
            </div>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {activity.changes.map((change) => (
              <div
                key={change.path}
                className="flex items-center gap-3 px-3.5 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20">
                  <FileCode2 className="h-3.5 w-3.5 text-white/45" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-white/72">
                    {change.path}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/34">
                    <span>
                      {change.status === "created" ? "Criado" : "Atualizado"}
                    </span>
                    <span>+{change.addedLines}</span>
                    <span>-{change.removedLines}</span>
                  </div>
                </div>

                {onOpenFile ? (
                  <button
                    type="button"
                    onClick={() => onOpenFile(change.path)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 text-[11px] text-white/70 transition-colors hover:bg-white/[0.08]"
                  >
                    Abrir
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
