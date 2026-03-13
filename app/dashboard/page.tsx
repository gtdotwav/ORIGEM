"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { useWorkspaceStore } from "@/stores/workspace-store";
import { persistSessionSnapshot } from "@/lib/chat-backend-client";
import {
  createId,
  createMessage,
  createSession,
  runSimpleChat,
} from "@/lib/chat-orchestrator";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

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
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWsName = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.name
  );
  const [ideasOpen, setIdeasOpen] = useState(false);

  const activeWorkspaceCount = workspaces.filter(
    (workspace) => workspace.status === "active"
  ).length;

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
    <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-14 pt-24 md:px-6 md:pb-16 md:pt-28">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[42px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(208,186,143,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_24%),linear-gradient(180deg,rgba(15,15,16,0.95),rgba(7,7,8,0.99))] p-6 shadow-[0_55px_160px_-50px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl md:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.3)] to-transparent" />

            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-center gap-2.5">
                  <Image
                    src="/logo.png"
                    alt="ORIGEM"
                    width={22}
                    height={22}
                    className="pointer-events-none opacity-90 drop-shadow-[0_0_22px_rgba(234,215,177,0.18)]"
                  />
                  <span className="rounded-full border border-[rgba(208,186,143,0.14)] bg-[rgba(208,186,143,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#d5c19a]/70">
                    Atelier operacional
                  </span>
                </div>

                <h1 className="max-w-4xl text-[clamp(2.8rem,5vw,5.35rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-white">
                  Operacao com direcao,
                  <br className="hidden lg:block" /> contexto e acabamento.
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-8 text-white/50 md:text-base">
                  Chat, runtime, agenda e ferramentas integrados para manter ritmo,
                  contexto e continuidade do primeiro comando ao output final.
                </p>
              </div>

              <ChatControlsMenu
                workspaceName={activeWsName}
                className="shrink-0 rounded-full border-[rgba(208,186,143,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
              />
            </div>

            <div
              className="mt-8 overflow-hidden rounded-[34px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6"
              data-tour="chat-input"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                    Nova sessao
                  </p>
                  <p className="mt-1.5 text-sm text-white/72">
                    Escreva com clareza o que precisa ser decidido, pesquisado, desenhado ou executado.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(208,186,143,0.12)] bg-[rgba(208,186,143,0.06)] px-3 py-1.5 text-[11px] text-[#d9c7a5]/70">
                  <Compass className="h-3.5 w-3.5" />
                  {activeWsName ? activeWsName : "Contexto global"}
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Descreva a meta, anexe uma imagem ou peca um plano de execucao."
                rows={1}
                className="block min-h-[128px] w-full resize-none border-none bg-transparent px-0 py-0 text-[20px] font-medium leading-relaxed tracking-[-0.03em] text-white/92 caret-[#e9d8b2] placeholder:text-white/22 outline-none ring-0 transition-all selection:bg-white/18 md:text-[22px]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void startSessionFromHome();
                  }
                }}
              />

              <div className="mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4">
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
                  <span className="hidden text-[11px] text-white/34 sm:inline">
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

            <WorkspaceReadinessStrip
              workspaceId={activeWorkspaceId}
              workspaceName={activeWsName}
              className="mt-6"
            />
          </motion.section>

          <section className="grid gap-4 lg:grid-cols-2">
            {COMMAND_SURFACES.map((surface) => {
              const Icon = surface.icon;

              return (
                <button
                  key={surface.title}
                  type="button"
                  onClick={() => router.push(surface.href)}
                  className="group relative overflow-hidden rounded-[34px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] p-6 text-left shadow-[0_24px_90px_-44px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))]"
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-80 transition-opacity group-hover:opacity-100",
                      surface.accent
                    )}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                        {surface.eyebrow}
                      </p>
                      <h2 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.05em] text-white">
                        {surface.title}
                      </h2>
                    </div>
                    <div
                      className={cn(
                        "rounded-full border p-3 text-white/72 transition-transform duration-300 group-hover:scale-105",
                        surface.iconTone
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-4 max-w-[34rem] text-sm leading-7 text-white/50">
                    {surface.description}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/76">
                    Abrir superficie
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="relative overflow-hidden rounded-[34px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(208,186,143,0.09),transparent_32%),linear-gradient(180deg,rgba(14,14,15,0.95),rgba(8,8,9,0.98))] p-5 shadow-[0_34px_100px_-44px_rgba(0,0,0,0.94),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.24)] to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                  Atelier
                </p>
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.05em] text-white">
                  Um panorama sob controle.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/46">
                  Workspace, historico e runtime continuam legiveis sem poluir a composicao.
                </p>
              </div>
              <div className="rounded-full border border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)] p-3 text-[#ead7b1]">
                <Workflow className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
                  Workspace em foco
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {activeWsName ?? "Contexto global"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/42">
                  {activeWsName
                    ? "A operacao segue filtrada por este workspace."
                    : "Nenhum filtro fechado; a memoria da operacao esta aberta."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
                    Sessoes
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                    {sessions.length}
                  </p>
                  <p className="text-[11px] text-white/40">Historico pronto para continuidade</p>
                </div>
                <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
                    Workspaces
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                    {activeWorkspaceCount}
                  </p>
                  <p className="text-[11px] text-white/40">Contextos vivos para a operacao</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-2.5">
              <button
                type="button"
                onClick={() => router.push("/dashboard/workspaces")}
                className="inline-flex items-center justify-between rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3.5 py-3 text-[12px] font-medium text-white/72 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Organizar workspaces
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings/providers")}
                className="inline-flex items-center justify-between rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3.5 py-3 text-[12px] font-medium text-white/72 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Plug className="h-4 w-4" />
                  Ajustar runtime e providers
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <CalendarWidget variant="panel" />
        </aside>
      </div>

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
