"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Bot,
  FileText,
  Bell,
  Mail,
  Webhook,
  Globe,
  Terminal,
  RefreshCw,
  BarChart3,
  Database,
  ChevronDown,
  Trash2,
  Pause,
  Play,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAutomationStore,
  type AutomationActionType,
  type AutomationJob,
} from "@/stores/automation-store";
import { describeCron } from "@/lib/cron";
import { CronBuilder } from "./cron-builder";

const ACTION_TYPES: {
  value: AutomationActionType;
  label: string;
  desc: string;
  icon: typeof Bot;
  color: string;
}[] = [
  { value: "run-agent", label: "Rodar Agente IA", desc: "Executar agente autonomo", icon: Bot, color: "text-neon-purple" },
  { value: "generate-content", label: "Gerar Conteudo", desc: "Criar conteudo com IA", icon: FileText, color: "text-neon-cyan" },
  { value: "send-notification", label: "Notificacao", desc: "Enviar notificacao push", icon: Bell, color: "text-neon-orange" },
  { value: "send-email", label: "Enviar Email", desc: "Email automatizado", icon: Mail, color: "text-neon-pink" },
  { value: "trigger-webhook", label: "Webhook", desc: "Disparar webhook externo", icon: Webhook, color: "text-neon-green" },
  { value: "run-api", label: "Chamada API", desc: "Requisicao HTTP", icon: Globe, color: "text-neon-blue" },
  { value: "run-script", label: "Script", desc: "Executar script interno", icon: Terminal, color: "text-neon-cyan" },
  { value: "data-sync", label: "Sync de Dados", desc: "Sincronizar dados", icon: RefreshCw, color: "text-neon-green" },
  { value: "analytics-report", label: "Relatorio", desc: "Gerar relatorio analytics", icon: BarChart3, color: "text-neon-orange" },
  { value: "backup", label: "Backup", desc: "Backup automatico", icon: Database, color: "text-neon-purple" },
];

interface AutomationSectionProps {
  eventId?: string;
  compact?: boolean;
}

export function AutomationSection({ eventId, compact }: AutomationSectionProps) {
  const jobs = useAutomationStore((s) => s.jobs);
  const addJob = useAutomationStore((s) => s.addJob);
  const removeJob = useAutomationStore((s) => s.removeJob);
  const toggleJob = useAutomationStore((s) => s.toggleJob);

  const eventJobs = eventId ? jobs.filter((j) => j.calendarEventId === eventId) : [];

  const [creating, setCreating] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AutomationActionType | null>(null);
  const [cronExpr, setCronExpr] = useState("0 9 * * *");
  const [jobName, setJobName] = useState("");
  const [showActions, setShowActions] = useState(false);

  const handleCreate = () => {
    if (!selectedAction) return;
    const actionMeta = ACTION_TYPES.find((a) => a.value === selectedAction);
    addJob({
      calendarEventId: eventId,
      name: jobName.trim() || actionMeta?.label || "Automacao",
      description: actionMeta?.desc || "",
      cronExpression: cronExpr,
      actionType: selectedAction,
      payload: {},
      active: true,
    });
    setCreating(false);
    setSelectedAction(null);
    setJobName("");
    setCronExpr("0 9 * * *");
    setShowActions(false);
  };

  const selectedActionMeta = ACTION_TYPES.find((a) => a.value === selectedAction);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-neon-green/60" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-green/60">
          Automacoes
        </span>
        {eventJobs.length > 0 && (
          <span className="ml-auto rounded-full bg-neon-green/10 px-1.5 py-0.5 text-[8px] font-bold tabular-nums text-neon-green">
            {eventJobs.length}
          </span>
        )}
      </div>

      {/* Existing jobs */}
      {eventJobs.map((job) => (
        <JobCard key={job.id} job={job} onToggle={() => toggleJob(job.id)} onRemove={() => removeJob(job.id)} compact={compact} />
      ))}

      {/* Create button */}
      {!creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neon-green/15 py-1.5 text-[10px] text-neon-green/40 transition-all hover:border-neon-green/30 hover:text-neon-green/70"
        >
          <Zap className="h-3 w-3" />
          Adicionar automacao
        </button>
      )}

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 rounded-lg border border-neon-green/15 bg-neon-green/[0.03] p-2.5">
              {/* Job name */}
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Nome da automacao..."
                className="w-full rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1.5 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-green/30"
                autoFocus
              />

              {/* Action type selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowActions(!showActions)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-[11px] transition-all",
                    selectedAction
                      ? "border-neon-green/20 bg-neon-green/[0.05] text-foreground/70"
                      : "border-foreground/[0.06] bg-black/20 text-foreground/30"
                  )}
                >
                  {selectedActionMeta ? (
                    <span className="flex items-center gap-1.5">
                      <selectedActionMeta.icon className={cn("h-3 w-3", selectedActionMeta.color)} />
                      {selectedActionMeta.label}
                    </span>
                  ) : (
                    "Selecionar acao..."
                  )}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showActions && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showActions && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-foreground/[0.08] bg-card/95 p-1 shadow-lg backdrop-blur-xl"
                    >
                      {ACTION_TYPES.map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          onClick={() => {
                            setSelectedAction(action.value);
                            setShowActions(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all hover:bg-foreground/[0.05]",
                            selectedAction === action.value && "bg-neon-green/[0.06]"
                          )}
                        >
                          <action.icon className={cn("h-3.5 w-3.5 shrink-0", action.color)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground/70">{action.label}</p>
                            <p className="text-[9px] text-foreground/25">{action.desc}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cron Builder */}
              {selectedAction && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CronBuilder value={cronExpr} onChange={setCronExpr} />
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setSelectedAction(null);
                    setShowActions(false);
                  }}
                  className="rounded-md px-2 py-1 text-[10px] text-foreground/30 hover:text-foreground/50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!selectedAction}
                  className="flex items-center gap-1 rounded-md border border-neon-green/30 bg-neon-green/10 px-2.5 py-1 text-[10px] font-medium text-neon-green transition-all hover:bg-neon-green/20 disabled:opacity-30"
                >
                  <Zap className="h-2.5 w-2.5" />
                  Criar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JobCard({
  job,
  onToggle,
  onRemove,
  compact,
}: {
  job: AutomationJob;
  onToggle: () => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  const actionMeta = ACTION_TYPES.find((a) => a.value === job.actionType);
  const Icon = actionMeta?.icon ?? Zap;

  return (
    <div className="group rounded-lg border border-neon-green/10 bg-neon-green/[0.02] px-2.5 py-2 transition-all hover:border-neon-green/20">
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", actionMeta?.color ?? "text-neon-green", !job.active && "opacity-30")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[11px] font-medium", job.active ? "text-foreground/80" : "text-foreground/30")}>
              {job.name}
            </span>
            <span
              className={cn(
                "rounded-full px-1 py-0.5 text-[7px] font-bold uppercase",
                job.active
                  ? "bg-neon-green/10 text-neon-green"
                  : "bg-foreground/[0.05] text-foreground/25"
              )}
            >
              {job.active ? "Ativo" : "Pausado"}
            </span>
          </div>
          <p className="text-[9px] text-foreground/30">{describeCron(job.cronExpression)}</p>
          {!compact && (
            <div className="mt-1 flex items-center gap-2 text-[8px] text-foreground/20">
              {job.lastRunAt && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2 w-2" />
                  {new Date(job.lastRunAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              )}
              <span>{job.runCount} execucoes</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-foreground/20 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/50"
            title={job.active ? "Pausar" : "Ativar"}
          >
            {job.active ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1 text-foreground/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Remover"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
