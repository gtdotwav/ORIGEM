"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Settings, Atom, Send, Loader2, MessageCircle, Workflow, History, X, ArrowUpRight, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { LLMSelector } from "@/components/chat/llm-selector";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { CriticPanel } from "@/components/chat/critic-panel";
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
  const sessions = useSessionStore((s) => s.sessions);
  const removeSession = useSessionStore((s) => s.removeSession);
  const [historyOpen, setHistoryOpen] = useState(false);

  const looseSessions = sessions.filter((s) => !s.projectId);

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
      await persistSessionSnapshot(sessionId);
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
      {/* Subtle radial focus — complements layout HologramBackground */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_20%,rgba(0,0,0,0.35)_75%)]" />

      {/* Floating chat history button */}
      <button
        type="button"
        onClick={() => setHistoryOpen(!historyOpen)}
        className="fixed right-4 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/[0.10] bg-neutral-900/80 text-white/40 shadow-lg backdrop-blur-xl transition-all hover:border-neon-cyan/30 hover:bg-neutral-900/90 hover:text-neon-cyan"
        title="Historico de chats"
      >
        <History className="h-4.5 w-4.5" />
      </button>

      {/* Chat history panel */}
      {historyOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-neon-cyan" />
              <h2 className="text-sm font-semibold text-white/80">Historico</h2>
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/35">
                {looseSessions.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {looseSessions.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <History className="mb-3 h-8 w-8 text-white/10" />
                <p className="text-xs text-white/30">
                  Conversas avulsas aparecerao aqui
                </p>
                <p className="mt-1 text-[10px] text-white/20">
                  Chats que nao evoluiram para projetos
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {looseSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group flex items-start gap-2 rounded-lg border border-transparent p-2 transition-all hover:border-white/[0.06] hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/chat/${session.id}`}
                        className="block"
                      >
                        <p className="truncate text-xs font-medium text-white/70 group-hover:text-white/90">
                          {session.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/25">
                          {new Date(session.updatedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </Link>
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/dashboard/chat/${session.id}`}
                        className="rounded-md p-1 text-white/30 hover:bg-white/[0.06] hover:text-neon-cyan"
                        title="Abrir chat"
                      >
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          removeSession(session.id);
                          toast.success("Conversa removida");
                        }}
                        className="rounded-md p-1 text-white/30 hover:bg-white/[0.06] hover:text-red-400"
                        title="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <p className="text-[10px] text-white/20">
              Chats avulsos — sem projeto vinculado
            </p>
          </div>
        </motion.div>
      )}

      {/* Overlay */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setHistoryOpen(false)}
        />
      )}

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
        <div className="w-full rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 shadow-2xl backdrop-blur-xl">
          {/* Greeting */}
          <div className="mb-1 flex items-center gap-2">
            <Atom className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white/70">Bem-vindo ao ORIGEM</span>
          </div>

          <h1 className="mb-5 text-2xl font-semibold text-white">
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
          <div className="mb-3 rounded-xl bg-white/[0.06] px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte qualquer coisa..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
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
                    !isEcosystem ? "text-neon-cyan" : "text-white/25"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] transition-colors",
                    !isEcosystem ? "text-white/60" : "text-white/25"
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
                    isEcosystem ? "text-neon-purple" : "text-white/25"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] transition-colors",
                    isEcosystem ? "text-white/60" : "text-white/25"
                  )}
                >
                  360
                </span>
              </div>
            </div>
            <div className="h-4 w-px bg-white/[0.08]" />
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
                className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/50 disabled:cursor-not-allowed disabled:opacity-40"
                title="Enviar imagem"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <CriticPanel />
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings/providers")}
                className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
                title="Configuracoes"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
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
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-white/70"
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
          <p className="text-[10px] text-white/15">ORIGEM — Psychosemantic AI Engine</p>
        </div>
      </div>
    </div>
  );
}
