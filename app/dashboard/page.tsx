"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Settings,
  Send,
  Loader2,
  Blocks as SparklesIcon,
  Paperclip,
  Mic,
  ArrowUp,
  MessageCircle,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { LeftToolbar } from "@/components/layout/left-toolbar";
import { LLMSelector } from "@/components/chat/llm-selector";
import { ChatModeToggle } from "@/components/apps/chat-mode-toggle";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { CriticPanel } from "@/components/chat/critic-panel";
import { IdeaSwiper } from "@/components/chat/idea-swiper";
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
  const chatMode = usePersonaStore((s) => s.chatMode);
  const isEcosystem = chatMode === "ecosystem";
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

    addSession(session);
    setCurrentSession(sessionId);
    addMessage(createMessage(sessionId, "user", text, options?.metadata));
    setInput("");
    setSending(true);

    router.push(`/dashboard/chat/${sessionId}`);

    try {
      if (isEcosystem) {
        await runChatOrchestration(sessionId, text);
      } else {
        await runSimpleChat(sessionId, text);
      }
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

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-between overflow-hidden px-4 py-8">

      <LeftToolbar />

      {/* Spacer to push chat card to center */}
      <div className="flex-1" />

      {/* Central chat card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-[680px] flex-col items-center"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -inset-16 rounded-[60px] bg-neon-cyan/[0.03] blur-3xl" />

        <div className="w-full overflow-hidden rounded-2xl border border-foreground/[0.05] bg-card/70 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Image src="/logo.png" alt="ORIGEM" width={18} height={18} className="pointer-events-none opacity-60" />
              <span className="text-[12px] font-medium tracking-wide text-foreground/40">
                Bem-vindo ao ORIGEM
              </span>
            </div>

            <h1 className="text-[22px] font-semibold leading-tight text-foreground/90">
              Como posso ajudar hoje?
            </h1>

            {/* Workspace indicator */}
            {activeWsName && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-neon-cyan/60">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan/50" />
                Criando em: {activeWsName}
              </div>
            )}
          </div>

          {/* Input area — fully borderless */}
          <div className="px-6 pb-2" data-tour="chat-input">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Descreva o que precisa..."
                rows={1}
                className="block w-full resize-none border-none bg-transparent px-0 pt-0 pb-3 text-[15px] leading-relaxed text-foreground caret-neon-cyan placeholder:text-foreground/18 outline-none ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void startSessionFromHome();
                  }
                }}
              />

              {/* Toolbar */}
              <div className="flex items-center gap-1">
                {/* Left tools */}
                <button
                  type="button"
                  onClick={openImagePicker}
                  disabled={sending || uploadingImage}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50 disabled:opacity-30"
                  title="Anexar imagem"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
                <AIVoiceInput
                  onStop={(dur) => {
                    if (dur > 0) setInput(`[Audio: ${dur}s] ${input}`);
                  }}
                />
                <CriticPanel />
                <button
                  type="button"
                  onClick={() => setIdeasOpen((v) => !v)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    ideasOpen
                      ? "bg-neon-purple/10 text-neon-purple"
                      : "text-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground/50"
                  )}
                  title="Gerar ideias"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                </button>

                <div className="flex-1" />

                {/* Hint */}
                {!hasInput && (
                  <span className="mr-2 hidden text-[10px] text-foreground/15 sm:inline">
                    Enter para enviar
                  </span>
                )}

                {/* Send button */}
                <button
                  type="button"
                  onClick={() => void startSessionFromHome()}
                  disabled={!hasInput || sending || uploadingImage}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                    hasInput && !sending
                      ? "bg-neon-cyan text-black shadow-md shadow-neon-cyan/25 hover:bg-neon-cyan/90 hover:shadow-lg hover:shadow-neon-cyan/30 active:scale-95"
                      : "bg-foreground/[0.06] text-foreground/20"
                  )}
                >
                  {sending || uploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
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
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                  <span className="text-xs text-neon-cyan">Processando imagem...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idea swiper */}
          <AnimatePresence>
            {ideasOpen && (
              <div className="px-4 pb-3">
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
          <div className="flex items-center justify-between px-6 py-2.5">
            {/* Mode indicator */}
            <div className="flex items-center gap-1.5">
              {isEcosystem ? (
                <Workflow className="h-3 w-3 text-neon-purple/60" />
              ) : (
                <MessageCircle className="h-3 w-3 text-neon-cyan/50" />
              )}
              <span className={cn(
                "text-[11px] font-medium",
                isEcosystem ? "text-neon-purple/50" : "text-foreground/30"
              )}>
                {isEcosystem ? "Ecossistema" : "Chat direto"}
              </span>
            </div>

            {/* Right side tools */}
            <div className="flex items-center gap-1">
              <LLMSelector className="" />
              <ChatModeToggle />
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings/providers")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/20 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/40"
                title="Configuracoes"
              >
                <Settings className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleImageSelected(event);
        }}
      />

      {/* Footer */}
      <div className="flex flex-1 items-end pb-4">
        <div className="text-center">
          <p className="text-[10px] text-foreground/12">ORIGEM — Intelligence OS</p>
        </div>
      </div>
    </div>
  );
}
