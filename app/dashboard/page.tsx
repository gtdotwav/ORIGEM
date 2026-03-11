"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Blocks as SparklesIcon,
  Paperclip,
  ArrowUp,
  Orbit,
  Plug,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { LeftToolbar } from "@/components/layout/left-toolbar";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { IdeaSwiper } from "@/components/chat/idea-swiper";
import { ChatControlsMenu } from "@/components/chat/chat-controls-menu";
import { useClientMounted } from "@/hooks/use-client-mounted";
import {
  buildCalendarPromptContext,
  mergeCalendarMetadata,
} from "@/lib/chat/calendar-context";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { persistSessionSnapshot } from "@/lib/chat-backend-client";
import {
  createId,
  createMessage,
  createSession,
  runChatOrchestration,
  runSimpleChat,
} from "@/lib/chat-orchestrator";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

interface ImageAttachmentMetadata {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

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
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWsName = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.name
  );
  const [ideasOpen, setIdeasOpen] = useState(false);

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
        `Analise a imagem anexada (${file.name}) e gere contexto, agentes, projeto e plano de execucao.`;

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
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-between overflow-hidden px-4 pb-[8.5rem] pt-4 md:py-8">

      {/* Spacer to push chat card to center */}
      <div className="flex-1" />

      {/* Central chat card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-[720px] flex-col items-center"
      >
        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl md:rounded-[32px]">
          {/* Header */}
          <div className="px-5 pb-4 pt-5 md:px-6 md:pt-6">
            <div className="mb-1.5 flex items-center gap-2">
              <Image src="/logo.png" alt="ORIGEM" width={18} height={18} className="pointer-events-none opacity-80" />
              <span className="text-[12px] font-medium tracking-wide text-foreground/55">
                Bem-vindo ao ORIGEM
              </span>
            </div>

            <h1 className="text-[20px] font-semibold leading-tight text-foreground/90 md:text-[22px]">
              Como posso ajudar hoje?
            </h1>

            {/* Workspace indicator */}
            {activeWsName && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-foreground/42">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/35" />
                Criando em: {activeWsName}
              </div>
            )}
          </div>

          {/* Input area — fully borderless */}
          <div className="px-5 pb-2 md:px-6" data-tour="chat-input">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Descreva o que precisa..."
                rows={1}
                className="block w-full resize-none border-none bg-transparent px-0 pt-0 pb-3 text-[15.5px] font-medium leading-relaxed text-white/90 caret-neon-cyan placeholder:text-white/30 outline-none ring-0 transition-all selection:bg-white/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void startSessionFromHome();
                  }
                }}
              />

              {/* Toolbar */}
              <div className="flex items-center gap-1.5 border-t border-white/[0.04] pt-3">
                {/* Left tools */}
                <button
                  type="button"
                  onClick={openImagePicker}
                  disabled={sending || uploadingImage}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50 disabled:opacity-30"
                  aria-label="Anexar imagem"
                  title="Anexar imagem"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
                <AIVoiceInput
                  onStop={(dur) => {
                    if (dur > 0) setInput(`[Audio: ${dur}s] ${input}`);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIdeasOpen((v) => !v)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    ideasOpen
                      ? "bg-foreground/[0.08] text-foreground/70"
                      : "text-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground/50"
                  )}
                  aria-label="Gerar ideias"
                  title="Gerar ideias"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                </button>

                <div className="flex-1" />

                {/* Hint */}
                {!hasInput && (
                  <span className="mr-2 hidden text-[10px] text-foreground/35 sm:inline">
                    Enter para enviar
                  </span>
                )}

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => void startSessionFromHome()}
                  disabled={!hasInput || sending || uploadingImage}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                    hasInput && !sending
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-white/90 hover:scale-105 active:scale-95"
                      : "bg-white/[0.06] text-white/25"
                  )}
                >
                  {sending || uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
          </div>

          {/* Upload indicator */}
          <AnimatePresence>
            {uploadingImage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-4"
              >
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-foreground/72" />
                  <span className="text-xs text-foreground/68">Processando imagem...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idea swiper */}
          <AnimatePresence>
            {ideasOpen && (
              <div className="px-3 pb-3 md:px-4">
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
            )}
          </AnimatePresence>

          {/* Footer bar */}
          <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-2.5">
            <div className="text-[11px] text-foreground/32">
              {hasInput ? "Shift + Enter para quebrar linha" : "Acoes extras em Ajustes"}
            </div>

            <ChatControlsMenu workspaceName={activeWsName} />
          </div>
        </div>
      </motion.div>

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

      <LeftToolbar />

      {/* Starting Points Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-10 flex w-full max-w-[720px] flex-col"
      >
        <p className="mb-5 pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          Ou escolha seu ponto de partida
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/agents")}
            className="group flex flex-col items-start rounded-3xl border border-white/[0.06] bg-black/40 p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03] text-white/50 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:text-neon-cyan group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <SparklesIcon className="h-4.5 w-4.5" />
            </div>
            <span className="text-[14px] font-semibold text-white/90">Criar Agente</span>
            <span className="mt-1.5 text-[11.5px] leading-relaxed text-white/40">Montar autonomia do zero</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/skills")}
            className="group flex flex-col items-start rounded-3xl border border-white/[0.06] bg-black/40 p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03] text-white/50 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:text-neon-cyan group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[14px] font-semibold text-white/90">Executar Skill</span>
            <span className="mt-1.5 text-[11.5px] leading-relaxed text-white/40">Usar automacao pronta</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/connections")}
            className="group flex flex-col items-start rounded-3xl border border-white/[0.06] bg-black/40 p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03] text-white/50 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:text-neon-cyan group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Plug className="h-4.5 w-4.5" />
            </div>
            <span className="text-[14px] font-semibold text-white/90">Conectar Dados</span>
            <span className="mt-1.5 text-[11.5px] leading-relaxed text-white/40">Importar infra e MCP</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/spaces")}
            className="group flex flex-col items-start rounded-3xl border border-white/[0.06] bg-black/40 p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03] text-white/50 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:text-neon-cyan group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Orbit className="h-4.5 w-4.5" />
            </div>
            <span className="text-[14px] font-semibold text-white/90">Abrir Spaces</span>
            <span className="mt-1.5 text-[11.5px] leading-relaxed text-white/40">Geração de mídia visual</span>
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="flex flex-1 items-end pb-4 pt-12">
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">ORIGEM — Intelligence OS</p>
        </div>
      </div>
    </div>
  );
}
