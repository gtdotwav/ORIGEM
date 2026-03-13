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
  LayoutDashboard,
  Layers,
  Plug,
  Presentation,
  Search,
  Workflow,
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
    title: "Pesquisa ao vivo",
    description: "Busque sinais, posts, noticias e leve tudo para o chat com contexto.",
    cta: "Abrir pesquisa",
    href: "/dashboard/feed",
    icon: Search,
    tone: "border-cyan-400/20 bg-cyan-400/8 hover:border-cyan-400/35 hover:bg-cyan-400/12",
  },
  {
    title: "Planejar semana",
    description: "Transforme objetivos em agenda, blocos de execucao e convites do calendario.",
    cta: "Abrir calendario",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    tone: "border-green-400/20 bg-green-400/8 hover:border-green-400/35 hover:bg-green-400/12",
  },
  {
    title: "Construir interface",
    description: "Abra o editor com IA para transformar direcao em codigo, layout e componentes.",
    cta: "Abrir code",
    href: "/dashboard/code",
    icon: Code2,
    tone: "border-blue-400/20 bg-blue-400/8 hover:border-blue-400/35 hover:bg-blue-400/12",
  },
  {
    title: "Gerar apresentacao",
    description: "Converta estrategia, pesquisa e execucao em slides objetivos e prontos para usar.",
    cta: "Abrir slides",
    href: "/dashboard/apps/slides",
    icon: Presentation,
    tone: "border-purple-400/20 bg-purple-400/8 hover:border-purple-400/35 hover:bg-purple-400/12",
  },
  {
    title: "Organizar workspaces",
    description: "Separe memoria, projetos, arquivos e conectores por operacao real.",
    cta: "Ver workspaces",
    href: "/dashboard/workspaces",
    icon: FolderKanban,
    tone: "border-white/[0.10] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.05]",
  },
  {
    title: "Conectar ferramentas",
    description: "Ative providers, MCPs e runtime para o sistema trabalhar com dados reais.",
    cta: "Abrir providers",
    href: "/dashboard/settings/providers",
    icon: Plug,
    tone: "border-orange-400/20 bg-orange-400/8 hover:border-orange-400/35 hover:bg-orange-400/12",
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
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-14 pt-24 md:px-6 md:pb-16 md:pt-28">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[34px] border border-white/[0.08] bg-black/42 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.72)] backdrop-blur-3xl md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-2 flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="ORIGEM"
                    width={20}
                    height={20}
                    className="pointer-events-none opacity-85"
                  />
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    Centro de comando
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-[2rem]">
                  Decida, pesquise e execute com o sistema inteiro a vista.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
                  Chat, runtime, agenda e ferramentas ficam prontos no mesmo fluxo para
                  reduzir troca de contexto e acelerar a execucao real.
                </p>
              </div>

              <ChatControlsMenu workspaceName={activeWsName} className="shrink-0" />
            </div>

            <WorkspaceReadinessStrip
              workspaceId={activeWorkspaceId}
              workspaceName={activeWsName}
              className="mt-5"
            />

            <div
              className="mt-5 overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-4 md:p-5"
              data-tour="chat-input"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/34">
                    Nova sessao
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    Descreva o que precisa ser decidido, pesquisado, construido ou executado.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/30 px-3 py-1.5 text-[11px] text-white/48">
                  <Compass className="h-3.5 w-3.5 text-neon-cyan" />
                  {activeWsName ? `Foco em ${activeWsName}` : "Contexto global"}
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Descreva a meta, anexe uma imagem ou peça um plano de execucao."
                rows={1}
                className="block min-h-[112px] w-full resize-none border-none bg-transparent px-0 py-0 text-[17px] font-medium leading-relaxed text-white/92 caret-neon-cyan placeholder:text-white/26 outline-none ring-0 transition-all selection:bg-white/18 md:text-[18px]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void startSessionFromHome();
                  }
                }}
              />

              <div className="mt-4 flex items-center gap-2 border-t border-white/[0.05] pt-4">
                <button
                  type="button"
                  onClick={openImagePicker}
                  disabled={sending || uploadingImage}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/42 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
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
                    "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                    ideasOpen
                      ? "border-white/[0.16] bg-white/[0.08] text-white/78"
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
                    Enter envia. Shift + Enter quebra linha.
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => void startSessionFromHome()}
                  disabled={!hasInput || sending || uploadingImage}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all duration-300",
                    hasInput && !sending
                      ? "bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.34)] hover:bg-white/92"
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
          </motion.section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {COMMAND_SURFACES.map((surface) => {
              const Icon = surface.icon;

              return (
                <button
                  key={surface.title}
                  type="button"
                  onClick={() => router.push(surface.href)}
                  className={cn(
                    "group rounded-[28px] border p-5 text-left backdrop-blur-2xl transition-all duration-300",
                    surface.tone
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                        Superficie
                      </p>
                      <h2 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
                        {surface.title}
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-2.5 text-white/72 transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-white/48">
                    {surface.description}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/72">
                    {surface.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-white/[0.08] bg-black/34 p-5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                  Panorama
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                  Operacao pronta para girar
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/48">
                  Veja o que esta ativo, continue sessoes com contexto e abra as superfícies
                  certas sem quebrar a linha de raciocinio.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-white/70">
                <Workflow className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">
                  Sessoes
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{sessions.length}</p>
                <p className="text-[11px] text-white/42">Historico pronto para continuidade</p>
              </div>
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">
                  Workspaces
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{activeWorkspaceCount}</p>
                <p className="text-[11px] text-white/42">Contextos ativos para filtrar a operacao</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/control")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-white/68 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Ver operacao
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/apps")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-white/68 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <Layers className="h-3.5 w-3.5" />
                Abrir superficies
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
