"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Settings, Send, Loader2, MessageCircle, Workflow, History, Plug, Calendar, Sparkles as SparklesIcon } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { ConnectorsPanel } from "@/components/chat/connectors-panel";
import { CalendarPanel } from "@/components/chat/calendar-panel";
import { Switch } from "@/components/ui/switch";
import { LLMSelector } from "@/components/chat/llm-selector";
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

const SUGGESTIONS = [
  "Decompor um conceito",
  "Criar mapa de contexto",
  "Orquestrar agentes",
  "Analisar semantica",
];

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
  const setChatMode = usePersonaStore((s) => s.setChatMode);
  const isEcosystem = chatMode === "ecosystem";
  const [historyOpen, setHistoryOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);

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

      {/* Left toolbar — vertical button strip */}
      <div className="fixed left-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-foreground/[0.06] bg-card/80 p-1 shadow-lg backdrop-blur-xl">
        <button
          type="button"
          onClick={() => { setHistoryOpen(!historyOpen); setConnectorsOpen(false); setCalendarOpen(false); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="Historico"
        >
          <History className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => { setConnectorsOpen(!connectorsOpen); setHistoryOpen(false); setCalendarOpen(false); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="Conectores"
        >
          <Plug className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => { setCalendarOpen(!calendarOpen); setHistoryOpen(false); setConnectorsOpen(false); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="Calendario"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      </div>

      <ChatHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onCreateCanvas={() => router.push("/dashboard/canvas")}
      />

      <ConnectorsPanel
        open={connectorsOpen}
        onClose={() => setConnectorsOpen(false)}
      />

      <CalendarPanel
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />

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

          {/* Input field */}
          <div className="mb-3 rounded-xl bg-foreground/[0.06] px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte qualquer coisa..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void startSessionFromHome();
                }
              }}
            />
          </div>

          {/* Mode toggle + Tier selector */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <MessageCircle
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    !isEcosystem ? "text-neon-cyan" : "text-foreground/25"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] transition-colors",
                    !isEcosystem ? "text-foreground/60" : "text-foreground/25"
                  )}
                >
                  Chat
                </span>
              </div>
              <Switch
                checked={isEcosystem}
                onCheckedChange={(checked) =>
                  setChatMode(checked ? "ecosystem" : "direct")
                }
              />
              <div className="flex items-center gap-1.5">
                <Workflow
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isEcosystem ? "text-neon-purple" : "text-foreground/25"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] transition-colors",
                    isEcosystem ? "text-foreground/60" : "text-foreground/25"
                  )}
                >
                  360
                </span>
              </div>
            </div>
            <div className="h-4 w-px bg-foreground/[0.08]" />
            <LLMSelector />
          </div>

          {/* Controls row */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <AIVoiceInput
                onStop={(dur) => {
                  if (dur > 0) setInput(`[Audio: ${dur}s] ${input}`);
                }}
              />
              <button
                type="button"
                onClick={openImagePicker}
                disabled={sending || uploadingImage}
                className="rounded-lg p-2 text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground/50 disabled:cursor-not-allowed disabled:opacity-40"
                title="Enviar imagem"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <CriticPanel />
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings/providers")}
                className="rounded-lg p-2 text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground/50"
                title="Configuracoes"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIdeasOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  ideasOpen
                    ? "border-neon-purple/40 bg-neon-purple/15 text-neon-purple"
                    : "border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 hover:border-neon-purple/30 hover:bg-neon-purple/5 hover:text-neon-purple/70"
                )}
                title="Gerar ideias"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Ideias
              </button>
              <button
                type="button"
                onClick={() => void startSessionFromHome()}
                disabled={!input.trim() || sending || uploadingImage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {sending || uploadingImage ? "Enviando..." : "Enviar"}
              </button>
            </div>
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

          {/* Suggestion badges */}
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            {SUGGESTIONS.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                onClick={() => setInput(suggestion)}
                className="rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3.5 py-1.5 text-xs text-foreground/50 transition-all hover:border-foreground/15 hover:bg-foreground/[0.08] hover:text-foreground/70"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
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
