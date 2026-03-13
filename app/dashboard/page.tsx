"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Code2,
  Compass,
  FolderKanban,
  Loader2,
  Blocks as SparklesIcon,
  Paperclip,
  ArrowUp,
  Plug,
  Presentation,
  Search,
  Workflow,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { IdeaSwiper } from "@/components/chat/idea-swiper";
import { ChatControlsMenu } from "@/components/chat/chat-controls-menu";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { WorkspaceReadinessStrip } from "@/components/dashboard/workspace-readiness-strip";
import { useClientMounted } from "@/hooks/use-client-mounted";
import {
  buildCalendarPromptContext,
  mergeCalendarMetadata,
} from "@/lib/chat/calendar-context";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useSpacesStore } from "@/stores/spaces-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { persistSessionSnapshot } from "@/lib/chat-backend-client";
import {
  createId,
  createMessage,
  createSession,
  runSimpleChat,
} from "@/lib/chat-orchestrator";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

type MemoryView = "recent" | "spaces" | "workspaces";

interface ImageAttachmentMetadata {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

const COMMAND_SURFACES = [
  {
    eyebrow: "Radar",
    title: "Pesquisa ao vivo",
    description:
      "Leia sinais culturais, mercado e social com o mesmo contexto do comando principal.",
    href: "/dashboard/feed",
    icon: Search,
    accent:
      "from-[rgba(208,186,143,0.20)] via-[rgba(208,186,143,0.06)] to-transparent",
    iconTone:
      "border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)] text-[#ead7b1]",
  },
  {
    eyebrow: "Agenda",
    title: "Planejar semana",
    description:
      "Converta direcao em blocos, ritmo e convites sem quebrar a linha de execucao.",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    accent:
      "from-[rgba(149,179,155,0.20)] via-[rgba(149,179,155,0.06)] to-transparent",
    iconTone:
      "border-[rgba(149,179,155,0.16)] bg-[rgba(149,179,155,0.08)] text-[#d8e6db]",
  },
  {
    eyebrow: "Build",
    title: "Construir interface",
    description:
      "Leve a mesma direcao do comando para codigo, layout e sistema sem recomecar o raciocinio.",
    href: "/dashboard/code",
    icon: Code2,
    accent:
      "from-[rgba(144,168,198,0.20)] via-[rgba(144,168,198,0.06)] to-transparent",
    iconTone:
      "border-[rgba(144,168,198,0.16)] bg-[rgba(144,168,198,0.08)] text-[#d9e4f0]",
  },
  {
    eyebrow: "Delivery",
    title: "Gerar apresentacao",
    description:
      "Transforme estrategia, pesquisa e execucao em material final com acabamento e coerencia.",
    href: "/dashboard/apps/slides",
    icon: Presentation,
    accent:
      "from-[rgba(179,159,217,0.20)] via-[rgba(179,159,217,0.06)] to-transparent",
    iconTone:
      "border-[rgba(179,159,217,0.16)] bg-[rgba(179,159,217,0.08)] text-[#e2d8f3]",
  },
] as const;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function formatDateChip(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "agora";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function DashboardPage() {
  const mounted = useClientMounted();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const addSession = useSessionStore((s) => s.addSession);
  const addMessage = useSessionStore((s) => s.addMessage);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const sessions = useSessionStore((s) => s.sessions);
  const spaces = useSpacesStore((s) => s.spaces);
  const cards = useSpacesStore((s) => s.cards);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWsName = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.name
  );
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [memoryView, setMemoryView] = useState<MemoryView>("recent");

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 6),
    [sessions]
  );
  const recentSpaces = useMemo(
    () =>
      [...spaces]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6),
    [spaces]
  );
  const activeWorkspaces = useMemo(
    () =>
      [...workspaces]
        .filter((workspace) => workspace.status === "active")
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 6),
    [workspaces]
  );

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [input, adjustTextarea]);

  const startSessionFromHome = async (
    options?: { prompt?: string; metadata?: Record<string, unknown> }
  ) => {
    const text = (options?.prompt ?? input).trim();
    if (!text || sending) {
      return;
    }

    const sessionId = createId("session");
    const session = createSession(sessionId, text, activeWorkspaceId ?? undefined);
    const calendarContext = buildCalendarPromptContext(text);
    const messageMetadata = mergeCalendarMetadata(options?.metadata, calendarContext);

    addSession(session);
    setCurrentSession(sessionId);
    addMessage(createMessage(sessionId, "user", text, messageMetadata));
    setInput("");
    setSending(true);

    router.push(`/dashboard/chat/${sessionId}`);

    try {
      await runSimpleChat(sessionId, text, { calendarContext });
      persistSessionSnapshot(sessionId).catch((err) =>
        console.warn("[snapshot] persist failed (non-blocking):", err)
      );
    } catch {
      toast.error("Erro ao processar mensagem. Verifique suas configuracoes.");
    } finally {
      setSending(false);
    }
  };

  const openImagePicker = () => {
    if (sending || uploadingImage) {
      return;
    }

    imageInputRef.current?.click();
  };

  const handleImageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem valido.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("A imagem deve ter ate 3 MB.");
      return;
    }

    if (sending) {
      return;
    }

    setUploadingImage(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const typedPrompt = input.trim();
      const prompt =
        typedPrompt ||
        `Analise a imagem anexada (${file.name}) e gere um plano de execucao claro com contexto, prioridades e proximos passos.`;

      const metadata: { imageAttachment: ImageAttachmentMetadata } = {
        imageAttachment: {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        },
      };

      await startSessionFromHome({
        prompt,
        metadata,
      });
    } catch (error) {
      console.error("Failed to upload image from dashboard", error);
      toast.error("Nao foi possivel processar a imagem. Tente novamente.");
    } finally {
      setUploadingImage(false);
    }
  };

  const hasInput = input.trim().length > 0;

  if (!mounted) {
    return <div className="min-h-[calc(100vh-80px)]" />;
  }

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-14 pt-16 md:px-6 md:pb-16 md:pt-20">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[30px] border border-white/[0.05] bg-[radial-gradient(circle_at_top,rgba(208,186,143,0.05),transparent_26%),linear-gradient(180deg,rgba(9,9,10,0.78),rgba(4,4,5,0.9))] px-4 py-5 shadow-[0_34px_120px_-70px_rgba(0,0,0,0.98),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl md:px-6 md:py-6"
      >
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:160px_160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.3)] to-transparent" />

        <div className="relative mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(208,186,143,0.14)] bg-[rgba(208,186,143,0.05)] px-3 py-1.5 text-[#d5c19a]/70">
              <Image
                src="/logo.png"
                alt="ORIGEM"
                width={18}
                height={18}
                className="pointer-events-none opacity-90 drop-shadow-[0_0_22px_rgba(234,215,177,0.18)]"
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
                Comando
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/56">
                <Compass className="h-3.5 w-3.5 text-[#d9c7a5]/78" />
                {activeWsName ? activeWsName : "Contexto global"}
              </div>
              <ChatControlsMenu
                workspaceName={activeWsName}
                className="shrink-0 rounded-full border-white/[0.08] bg-white/[0.03]"
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/28">
              Command stage
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(2.5rem,4.8vw,4.6rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-white">
              Converse com contexto, Spaces e execucao no mesmo palco.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-white/42 md:text-base">
              O chat conduz. Memoria, agenda e superficies entram abaixo, apenas quando
              ajudam a continuar.
            </p>
          </div>

          <div
            className="mt-6 overflow-hidden rounded-[26px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.008))] p-4 shadow-[0_22px_72px_-52px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-5"
            data-tour="chat-input"
          >
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-white/24">
              chat • spaces • agenda • output
            </p>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Descreva a meta, anexe uma imagem ou peca um plano de execucao."
              rows={1}
              className="block min-h-[96px] w-full resize-none border-none bg-transparent px-0 py-0 text-[20px] font-medium leading-relaxed tracking-[-0.04em] text-white/92 caret-[#e9d8b2] placeholder:text-white/22 outline-none ring-0 transition-all selection:bg-white/18 md:text-[23px]"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void startSessionFromHome();
                }
              }}
            />

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-4">
              <button
                type="button"
                onClick={openImagePicker}
                disabled={sending || uploadingImage}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/42 transition-colors hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
                aria-label="Anexar imagem"
                title="Anexar imagem"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <AIVoiceInput
                onStop={(dur) => {
                  if (dur > 0) setInput(`[Audio: ${dur}s] ${input}`);
                }}
              />
              <button
                type="button"
                onClick={() => setIdeasOpen((value) => !value)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                  ideasOpen
                    ? "border-[rgba(208,186,143,0.18)] bg-[rgba(208,186,143,0.08)] text-[#ead7b1]"
                    : "border-white/[0.06] bg-white/[0.02] text-white/42 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                )}
                aria-label="Gerar ideias"
                title="Gerar ideias"
              >
                <SparklesIcon className="h-4 w-4" />
              </button>

              <div className="flex-1" />

              {!hasInput ? (
                <span className="hidden text-[11px] text-white/32 sm:inline">
                  Enter envia. Shift + Enter quebra a linha.
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => void startSessionFromHome()}
                disabled={!hasInput || sending || uploadingImage}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full px-[18px] text-sm font-semibold transition-all duration-300",
                  hasInput && !sending
                    ? "border border-[rgba(208,186,143,0.2)] bg-[linear-gradient(180deg,#f4ead4,#d8c4a0)] text-black shadow-[0_16px_40px_-20px_rgba(208,186,143,0.6)] hover:brightness-[1.03]"
                    : "bg-white/[0.06] text-white/25"
                )}
              >
                {sending || uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
                Enviar
              </button>
            </div>

            <AnimatePresence>
              {uploadingImage ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                    <span className="text-xs text-white/68">Processando imagem...</span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {ideasOpen ? (
                <div className="mt-4">
                  <IdeaSwiper
                    onSelectIdea={(prompt) => {
                      setInput(prompt);
                      setIdeasOpen(false);
                      textareaRef.current?.focus();
                    }}
                    onStartChat={(prompt) => {
                      setIdeasOpen(false);
                      void startSessionFromHome({ prompt });
                    }}
                    onClose={() => setIdeasOpen(false)}
                  />
                </div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      <WorkspaceReadinessStrip
        workspaceId={activeWorkspaceId}
        workspaceName={activeWsName}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="relative overflow-hidden rounded-[26px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(11,11,12,0.76),rgba(4,4,5,0.86))] p-5 shadow-[0_26px_90px_-58px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl md:p-5.5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.26)] to-transparent" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                Continuidade
              </p>
              <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                Retome sem sair do palco.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
                Sessões, Spaces e workspaces ficam logo abaixo do comando para manter a
                continuidade sem abrir outra frente visual.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
              {[
                { id: "recent", label: "Recentes" },
                { id: "spaces", label: "Spaces" },
                { id: "workspaces", label: "Workspaces" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMemoryView(tab.id as MemoryView)}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-all",
                    memoryView === tab.id
                      ? "bg-[rgba(208,186,143,0.12)] text-[#ead7b1]"
                      : "text-white/42 hover:text-white/78"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {memoryView === "recent" &&
              (recentSessions.length > 0 ? (
                recentSessions.map((session) => {
                  const sessionWorkspace = workspaces.find(
                    (workspace) => workspace.id === session.workspaceId
                  );

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/chat/${session.id}`)}
                      className="group rounded-[22px] border border-white/[0.06] bg-white/[0.018] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
                        Sessao
                      </p>
                      <h3 className="mt-3 line-clamp-2 text-[1rem] font-semibold leading-snug tracking-[-0.03em] text-white/92">
                        {session.title}
                      </h3>
                      <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-white/40">
                        <span className="truncate">
                          {sessionWorkspace?.name ?? "Contexto global"}
                        </span>
                        <span>{formatDateChip(session.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.015] p-5 text-sm text-white/44 sm:col-span-2 xl:col-span-3">
                  Nenhuma sessao ainda. Comece pelo comando acima e a continuidade aparece aqui.
                </div>
              ))}

            {memoryView === "spaces" &&
              (recentSpaces.length > 0 ? (
                recentSpaces.map((space) => {
                  const totalCards = cards.filter((card) => card.spaceId === space.id).length;

                  return (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
                      className="group rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
                        Space
                      </p>
                      <h3 className="mt-3 line-clamp-2 text-[1rem] font-semibold leading-snug tracking-[-0.03em] text-white/92">
                        {space.name}
                      </h3>
                      <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-white/40">
                        <span>{totalCards} card{totalCards === 1 ? "" : "s"}</span>
                        <span>{formatDateChip(space.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/spaces")}
                  className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.015] p-5 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.03] sm:col-span-2 xl:col-span-3"
                >
                  <p className="text-sm font-medium text-white/72">Criar o primeiro Space</p>
                  <p className="mt-2 text-sm leading-7 text-white/42">
                    Use Spaces para imagem, video e exploracao visual sem perder o contexto do chat.
                  </p>
                </button>
              ))}

            {memoryView === "workspaces" &&
              (activeWorkspaces.length > 0 ? (
                activeWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/workspaces/${workspace.id}`)}
                    className="group rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
                      Workspace
                    </p>
                    <h3 className="mt-3 line-clamp-2 text-[1rem] font-semibold leading-snug tracking-[-0.03em] text-white/92">
                      {workspace.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-6 text-white/42">
                      {workspace.description || "Contexto pronto para continuidade operacional."}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-white/40">
                      <span className="capitalize">{workspace.color}</span>
                      <span>{formatDateChip(workspace.updatedAt)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/workspaces")}
                  className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.015] p-5 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.03] sm:col-span-2 xl:col-span-3"
                >
                  <p className="text-sm font-medium text-white/72">Organizar workspaces</p>
                  <p className="mt-2 text-sm leading-7 text-white/42">
                    Crie contextos vivos para separar operacao, memoria, conectores e saídas.
                  </p>
                </button>
              ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CalendarWidget variant="panel" />

          <div className="relative overflow-hidden rounded-[26px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(11,11,12,0.76),rgba(4,4,5,0.86))] p-5 shadow-[0_26px_90px_-58px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.24)] to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                  Superficies
                </p>
                <h2 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-white">
                  Apoio sem brigar com o comando.
                </h2>
              </div>
              <div className="rounded-full border border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)] p-3 text-[#ead7b1]">
                <Workflow className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {COMMAND_SURFACES.map((surface) => {
                const Icon = surface.icon;

                return (
                  <button
                    key={surface.title}
                    type="button"
                    onClick={() => router.push(surface.href)}
                    className="group relative w-full overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-80 transition-opacity group-hover:opacity-100",
                        surface.accent
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
                          {surface.eyebrow}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                          {surface.title}
                        </h3>
                        <p className="mt-2 text-[12px] leading-6 text-white/42">
                          {surface.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-full border p-2.5 text-white/72 transition-transform duration-300 group-hover:scale-105",
                          surface.iconTone
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/62">
                      Abrir
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/workspaces")}
                className="inline-flex items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-[12px] font-medium text-white/72 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Workspaces
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings/providers")}
                className="inline-flex items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-[12px] font-medium text-white/72 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Plug className="h-4 w-4" />
                  Runtime
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        aria-label="Selecionar imagem"
        className="hidden"
        onChange={(event) => {
          void handleImageSelected(event);
        }}
      />
    </div>
  );
}
