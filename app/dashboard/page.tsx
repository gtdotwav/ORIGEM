"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Settings, Send, Loader2, ChevronDown, Sparkles as SparklesIcon } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);
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
  const [toolsExpanded, setToolsExpanded] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-between overflow-hidden px-4 py-8">

      <LeftToolbar />

      {/* Spacer to push chat card to center */}
      <div className="flex-1" />

      {/* Central chat card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-[640px] flex-col items-center"
      >
        <div className="pointer-events-none absolute -inset-10 rounded-[40px] border border-neon-cyan/8 bg-neon-cyan/4 blur-2xl" />
        <div className="w-full rounded-2xl border border-foreground/[0.08] bg-card/70 p-6 shadow-2xl backdrop-blur-xl">
          {/* Greeting */}
          <div className="mb-1 flex items-center gap-2">
            <Image src="/logo.png" alt="ORIGEM" width={20} height={20} className="pointer-events-none" />
            <span className="text-sm text-foreground/70">Bem-vindo ao ORIGEM</span>
          </div>

          <h1 className="mb-5 text-2xl font-semibold text-foreground">
            Como posso ajudar hoje?
          </h1>

          {/* Workspace indicator */}
          {activeWsName && (
            <div className="mb-2 flex items-center gap-2 text-xs text-neon-cyan/60">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan/50" />
              Criando em: {activeWsName}
            </div>
          )}

          {/* Main input row */}
          <div data-tour="chat-input" className="flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.04] p-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte qualquer coisa..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void startSessionFromHome();
                }
              }}
            />
            <button
              data-tour="tools-chevron"
              type="button"
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", toolsExpanded && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => void startSessionFromHome()}
              disabled={!input.trim() || sending || uploadingImage}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              {sending || uploadingImage ? "..." : "Enviar"}
            </button>
          </div>

          {/* Expanded tools panel */}
          <AnimatePresence>
            {toolsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
                  {/* Row 1 — Model + Mode */}
                  <div className="flex items-center gap-2">
                    <LLMSelector className="flex-1" />
                    <ChatModeToggle />
                  </div>

                  {/* Row 2 — Tools */}
                  <div className="mt-2 flex items-center gap-1 border-t border-foreground/[0.04] pt-2">
                    <AIVoiceInput
                      onStop={(dur) => {
                        if (dur > 0) setInput(`[Audio: ${dur}s] ${input}`);
                      }}
                    />
                    <button
                      type="button"
                      onClick={openImagePicker}
                      disabled={sending || uploadingImage}
                      className="rounded-lg p-2 text-foreground/25 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/50 disabled:opacity-40"
                      title="Enviar imagem"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </button>
                    <CriticPanel />
                    <button
                      type="button"
                      onClick={() => setIdeasOpen((v) => !v)}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        ideasOpen
                          ? "text-neon-purple"
                          : "text-foreground/25 hover:bg-foreground/[0.04] hover:text-foreground/50"
                      )}
                      title="Gerar ideias"
                    >
                      <SparklesIcon className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/settings/providers")}
                      className="rounded-lg p-2 text-foreground/20 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/40"
                      title="Configuracoes"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode indicator */}
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span className="text-[10px] text-foreground/20">
              {isEcosystem ? "agent \u221E" : "chat direto"}
            </span>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleImageSelected(event);
            }}
          />

          {/* Upload indicator */}
          {uploadingImage && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
              <span className="text-xs text-neon-cyan">Processando imagem...</span>
            </div>
          )}

          {/* Idea swiper */}
          <AnimatePresence>
            {ideasOpen && (
              <IdeaSwiper
                onSelectIdea={(prompt) => {
                  setInput(prompt);
                  setIdeasOpen(false);
                  inputRef.current?.focus();
                }}
                onStartChat={(prompt) => {
                  setIdeasOpen(false);
                  void startSessionFromHome({ prompt });
                }}
                onClose={() => setIdeasOpen(false)}
              />
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* Footer */}
      <div className="flex flex-1 items-end pb-4">
        <div className="text-center">
          <p className="text-[10px] text-foreground/15">ORIGEM — Psychosemantic AI Engine</p>
        </div>
      </div>
    </div>
  );
}
