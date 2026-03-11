"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Code2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  WrapText,
  FileCode,
  Circle,
  Send,
  Eye,
  Smartphone,
  Blocks,
  Bot,
  User,
  RotateCcw,
  Square,
  Terminal,
  Plus,
  Sparkles,
  Layers3,
  Brush,
  LayoutTemplate,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { callChatStream } from "@/lib/chat-api";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { useSessionSnapshotHydration } from "@/hooks/use-session-snapshot-hydration";
import { buildSessionHandoff, getStoredSessionHandoff } from "@/lib/session-handoff";
import {
  AESTHETIC_OPTIONS,
  advanceActivitySteps,
  buildCodeSystemPrompt,
  buildCompletedActivity,
  buildFileTree,
  buildOfflineStarterFiles,
  buildPreviewHtml,
  buildPendingActivity,
  ChatMessage,
  CODE_WELCOME_MESSAGE,
  CodeAesthetic,
  CodeProjectBrief,
  CodeStack,
  CodeSurface,
  CodeViewportTarget,
  createFileNode,
  extractWorklog,
  getBriefLabel,
  getChatSurfaceText,
  getExtColor,
  inferSurfaceFromImportedContext,
  parseCodeBlocks,
  PREVIEW_VIEWPORTS,
  PreviewViewport,
  CenterTab,
  STACK_OPTIONS,
  stripWorklogBlock,
  summarizeFileChanges,
  SURFACE_OPTIONS,
  VIEWPORT_OPTIONS,
} from "@/lib/code/code-surface";
import { WorkActivityCard } from "@/components/code/work-activity-card";
import { FileTree, type FileNode } from "@/components/ui/file-tree";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";

export default function CodeIDEPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useClientMounted();
  const handoffSessionId = searchParams.get("sessionId");
  const handoffContextId = searchParams.get("contextId");
  const [files, setFiles] = useState<Map<string, string>>(new Map());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [centerTab, setCenterTab] = useState<CenterTab>("preview");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [briefOpen, setBriefOpen] = useState(true);
  const [projectBrief, setProjectBrief] = useState<CodeProjectBrief>({
    surface: "landing-page",
    stack: "preview-safe",
    viewport: "responsive",
    aesthetic: "product",
    notes: "",
  });
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    CODE_WELCOME_MESSAGE,
  ]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamContentRef = useRef("");
  const streamFrameRef = useRef<number | null>(null);
  const progressTimeoutsRef = useRef<number[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const appliedHandoffRef = useRef<string | null>(null);

  const sessions = useSessionStore((state) => state.sessions);
  const messages = useSessionStore((state) => state.messages);
  const decompositions = useDecompositionStore((state) => state.decompositions);
  const activeDecompositionId = useDecompositionStore(
    (state) => state.activeDecompositionId
  );
  const runtime = useRuntimeStore((state) =>
    handoffSessionId ? state.sessions[handoffSessionId] : undefined
  );
  const agents = useAgentStore((state) => state.agents);
  const groups = useAgentStore((state) => state.groups);

  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const briefSummary = useMemo(
    () => [
      getBriefLabel(SURFACE_OPTIONS, projectBrief.surface),
      getBriefLabel(STACK_OPTIONS, projectBrief.stack),
      getBriefLabel(VIEWPORT_OPTIONS, projectBrief.viewport),
      getBriefLabel(AESTHETIC_OPTIONS, projectBrief.aesthetic),
    ],
    [projectBrief]
  );
  const handoffRevision = useMemo(
    () =>
      [
        sessions.length,
        messages.length,
        Object.keys(decompositions).length,
        activeDecompositionId ?? "",
        runtime?.updatedAt ?? 0,
        agents.length,
        groups.length,
      ].join(":"),
    [
      activeDecompositionId,
      agents.length,
      decompositions,
      groups.length,
      messages.length,
      runtime?.updatedAt,
      sessions.length,
    ]
  );
  const liveHandoff = useMemo(
    () => {
      const revision = handoffRevision;
      void revision;

      return handoffSessionId
        ? buildSessionHandoff({
            sessionId: handoffSessionId,
            target: "code",
            contextId: handoffContextId,
          })
        : null;
    },
    [handoffContextId, handoffRevision, handoffSessionId]
  );
  const storedHandoff = useMemo(
    () => {
      const revision = handoffRevision;
      void revision;

      return handoffSessionId ? getStoredSessionHandoff(handoffSessionId) : null;
    },
    [handoffRevision, handoffSessionId]
  );
  const activeHandoff = liveHandoff ?? storedHandoff;
  useSessionSnapshotHydration({
    sessionId: handoffSessionId,
    enabled:
      mounted &&
      Boolean(handoffSessionId) &&
      !sessions.some((session) => session.id === handoffSessionId),
    logLabel: "code surface",
  });

  useEffect(() => {
    if (!mounted || !activeHandoff) {
      return;
    }

    const handoffKey = `${activeHandoff.sessionId}:${activeHandoff.generatedAt}`;
    if (appliedHandoffRef.current === handoffKey) {
      return;
    }

    appliedHandoffRef.current = handoffKey;

    setProjectBrief((current) => ({
      ...current,
      surface:
        current.notes.trim().length === 0
          ? inferSurfaceFromImportedContext(activeHandoff.summary)
          : current.surface,
      notes:
        current.notes.trim().length > 0
          ? current.notes
          : activeHandoff.summary,
    }));

    setChatMessages((current) => {
      const importedMessageId = `handoff-${activeHandoff.sessionId}`;
      if (current.some((message) => message.id === importedMessageId)) {
        return current;
      }

      const importedMessage: ChatMessage = {
        id: importedMessageId,
        role: "assistant",
        content: [
          `Contexto importado da orquestra: ${activeHandoff.sessionTitle}.`,
          activeHandoff.summary,
          "A partir daqui, posso gerar ou ajustar os arquivos sem reiniciar a analise.",
        ].join("\n\n"),
        timestamp: 1,
      };

      return [...current, importedMessage];
    });
  }, [activeHandoff, mounted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) {
      return;
    }

    composer.style.height = "0px";
    composer.style.height = `${Math.min(composer.scrollHeight, 164)}px`;
  }, [chatInput]);

  const clearProgressTimers = useCallback(() => {
    progressTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    progressTimeoutsRef.current = [];

    if (streamFrameRef.current != null) {
      window.cancelAnimationFrame(streamFrameRef.current);
      streamFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearProgressTimers();
      abortControllerRef.current?.abort();
    };
  }, [clearProgressTimers]);

  const patchMessage = useCallback(
    (messageId: string, updater: (message: ChatMessage) => ChatMessage) => {
      setChatMessages((messages) =>
        messages.map((message) =>
          message.id === messageId ? updater(message) : message
        )
      );
    },
    []
  );

  const scheduleProgressSteps = useCallback(
    (messageId: string) => {
      clearProgressTimers();

      [900, 2200, 3800].forEach((delay, index) => {
        const timeoutId = window.setTimeout(() => {
          patchMessage(messageId, (message) => {
            if (!message.activity || message.activity.status !== "streaming") {
              return message;
            }

            return {
              ...message,
              activity: {
                ...message.activity,
                steps: advanceActivitySteps(message.activity.steps, Math.min(index + 1, message.activity.steps.length - 1)),
              },
            };
          });
        }, delay);

        progressTimeoutsRef.current.push(timeoutId);
      });
    },
    [clearProgressTimers, patchMessage]
  );

  const handleFileSelect = useCallback((node: FileNode) => {
    setSelectedFile(node);
    setCenterTab("editor");
    setCopied(false);
    setOpenTabs((tabs) => {
      if (tabs.some((tab) => (tab.path ?? tab.name) === (node.path ?? node.name))) {
        return tabs;
      }
      return [...tabs, node];
    });
  }, []);

  const handleCloseTab = useCallback((tabPath: string) => {
    setOpenTabs((tabs) => {
      const next = tabs.filter((tab) => (tab.path ?? tab.name) !== tabPath);
      if ((selectedFile?.path ?? selectedFile?.name) === tabPath) {
        setSelectedFile(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [selectedFile]);

  const selectFileByPath = useCallback(
    (path: string) => {
      const content = files.get(path);
      if (content == null) {
        return;
      }

      handleFileSelect(createFileNode(path, content));
    },
    [files, handleFileSelect]
  );

  const handleCopy = useCallback(async () => {
    if (!selectedFile?.content) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedFile]);

  const handleAbortStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /** Update files from AI-generated code blocks */
  const updateFilesFromBlocks = useCallback((blocks: { filename: string; content: string }[]) => {
    if (blocks.length === 0) return;
    setFiles((prev) => {
      const next = new Map(prev);
      for (const b of blocks) {
        next.set(b.filename, b.content);
      }
      return next;
    });
    // Open first new file
    const first = blocks[0];
    const node = createFileNode(first.filename, first.content);
    setSelectedFile(node);
    setCenterTab("preview");
    setOpenTabs((tabs) => {
      const filtered = tabs.filter(
        (tab) => (tab.path ?? tab.name) !== (node.path ?? node.name)
      );
      return [...filtered, node];
    });
    setPreviewKey((k) => k + 1);
  }, []);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    const input = chatInput.trim();
    const assistantId = `a-${Date.now()}`;
    const filesSnapshot = new Map(files);
    const pendingActivity = buildPendingActivity([...filesSnapshot.keys()]);

    setChatMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        activity: pendingActivity,
      },
    ]);
    setRightPanelOpen(true);
    setChatInput("");
    setIsSending(true);
    streamContentRef.current = "";
    abortControllerRef.current = new AbortController();
    scheduleProgressSteps(assistantId);

    try {
      const currentSelection = selectedFile?.path ?? selectedFile?.name ?? null;
      const systemPrompt = buildCodeSystemPrompt({
        brief: projectBrief,
        filesSnapshot,
        currentSelection,
        activeHandoff,
      });

      const { useChatSettingsStore } = await import("@/stores/chat-settings-store");
      const { selectedTier, ecosystemConfig } = useChatSettingsStore.getState();
      const hasManualSelection = Boolean(ecosystemConfig.provider) && Boolean(ecosystemConfig.model);

      const result = await callChatStream(
        {
          messages: [
            ...chatMessages.filter((m) => m.id !== "welcome").map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            { role: "user", content: input },
          ],
          systemPrompt,
          ...(hasManualSelection
            ? { provider: ecosystemConfig.provider ?? undefined, model: ecosystemConfig.model }
            : { tier: selectedTier }),
        },
        (fullContent) => {
          streamContentRef.current = fullContent;

          if (streamFrameRef.current != null) {
            return;
          }

          streamFrameRef.current = window.requestAnimationFrame(() => {
            const surfaceText = getChatSurfaceText(streamContentRef.current);

            patchMessage(assistantId, (message) => ({
              ...message,
              content: surfaceText,
            }));

            streamFrameRef.current = null;
          });
        },
        abortControllerRef.current.signal
      );

      const cleanedContent = stripWorklogBlock(result.content);
      const blocks = parseCodeBlocks(cleanedContent);
      const changes = summarizeFileChanges(filesSnapshot, blocks);
      const worklog = extractWorklog(result.content);

      patchMessage(assistantId, (message) => ({
        ...message,
        content: cleanedContent,
        provider: result.provider,
        model: result.model,
        activity: buildCompletedActivity(pendingActivity, worklog, changes),
      }));

      updateFilesFromBlocks(blocks);
    } catch (error) {
      const isAbort =
        error instanceof Error &&
        (error.name === "AbortError" || error.message === "The user aborted a request.");

      if (isAbort) {
        patchMessage(assistantId, (message) => ({
          ...message,
          content:
            getChatSurfaceText(streamContentRef.current) ||
            "Geracao interrompida antes da conclusao.",
          activity: message.activity
            ? {
                ...message.activity,
                status: "error",
                summary: "Geracao interrompida antes da conclusao.",
                finishedAt: Date.now(),
              }
            : undefined,
        }));

        return;
      }

      const fallbackBlocks =
        filesSnapshot.size === 0 ? buildOfflineStarterFiles(input) : [];

      if (fallbackBlocks.length > 0) {
        const fallbackChanges = summarizeFileChanges(filesSnapshot, fallbackBlocks);
        updateFilesFromBlocks(fallbackBlocks);

        patchMessage(assistantId, (message) => ({
          ...message,
          content:
            "Nao foi possivel conectar ao provedor de IA. Configure um provedor em Configuracoes > Provedores para gerar codigo.\n\nCriei uma base inicial offline para voce continuar editando no editor.",
          activity: {
            ...buildCompletedActivity(pendingActivity, null, fallbackChanges),
            summary: "Nao houve conexao com a IA, entao gerei uma base inicial offline.",
            status: "complete",
          },
        }));

        return;
      }

      patchMessage(assistantId, (message) => ({
        ...message,
        content:
          "Nao foi possivel conectar ao provedor de IA. Configure um provedor em Configuracoes > Provedores para gerar codigo.",
        activity: message.activity
          ? {
              ...message.activity,
              status: "error",
              summary: "A geracao falhou antes de concluir as alteracoes.",
              finishedAt: Date.now(),
            }
          : undefined,
      }));
    } finally {
      clearProgressTimers();
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }, [
    chatInput,
    isSending,
    chatMessages,
    files,
    projectBrief,
    selectedFile,
    activeHandoff,
    clearProgressTimers,
    patchMessage,
    scheduleProgressSteps,
    updateFilesFromBlocks,
  ]);

  // When files change, refresh the file tree and update open tabs
  useEffect(() => {
    const selectedPath = selectedFile?.path ?? selectedFile?.name;

    if (selectedFile && selectedPath && files.has(selectedPath)) {
      const content = files.get(selectedPath)!;
      if (content !== selectedFile.content) {
        const updated = { ...selectedFile, content } as FileNode;
        setSelectedFile(updated);
        setOpenTabs((tabs) =>
          tabs.map((tab) =>
            (tab.path ?? tab.name) === selectedPath ? updated : tab
          )
        );
      }
    }
  }, [files, selectedFile]);

  const lines = useMemo(
    () => selectedFile?.content?.split("\n") ?? [],
    [selectedFile?.content]
  );
  const previewHtml = useMemo(
    () => buildPreviewHtml(files, selectedFile),
    [files, selectedFile]
  );

  useEffect(() => {
    setPreviewKey((k) => k + 1);
  }, [selectedFile, files]);

  const hasFiles = files.size > 0;
  const activePreviewViewport =
    PREVIEW_VIEWPORTS.find((viewport) => viewport.value === previewViewport) ??
    PREVIEW_VIEWPORTS[0];
  const activeFilePath = selectedFile?.path ?? selectedFile?.name ?? null;

  if (!mounted) {
    return <div className="fixed inset-0 z-50 bg-[oklch(0.08_0_0)]" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.08_0_0)]">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.05] bg-[oklch(0.065_0_0)] px-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <Code2 className="h-3.5 w-3.5 text-neon-cyan/50" />
          <span className="text-[11px] font-semibold tracking-wide text-white/45">
            ORIGEM Code
          </span>
          {hasFiles && (
            <div className="flex items-center gap-1.5 rounded-full border border-neon-green/20 bg-neon-green/[0.08] px-2 py-0.5">
              <Circle className="h-1.5 w-1.5 fill-neon-green text-neon-green" />
              <span className="text-[9px] font-medium text-neon-green/80">
                {files.size} {files.size === 1 ? "arquivo" : "arquivos"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            title="Explorador"
          >
            {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setRightPanelOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            title="Assistente"
          >
            {rightPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              data-tour="code-files"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 overflow-hidden border-r border-white/[0.05] bg-[oklch(0.065_0_0)]"
            >
              <div className="flex h-8 items-center border-b border-white/[0.04] px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                  Explorer
                </span>
              </div>
              <div className="h-[calc(100%-2rem)] w-[240px] overflow-y-auto">
                {hasFiles ? (
                  <FileTree
                    data={fileTree}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile?.path ?? selectedFile?.name ?? null}
                    className="rounded-none border-0 bg-transparent"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
                    <Plus className="h-5 w-5 text-white/10" />
                    <p className="text-center text-[10px] text-white/20">
                      Use o chat para gerar os arquivos do projeto
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 overflow-hidden">
          {/* Center surface */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-12 items-center justify-between border-b border-white/[0.05] bg-[oklch(0.07_0_0)] px-3">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCenterTab("preview")}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-medium transition-all",
                    centerTab === "preview"
                      ? "border-neon-green/24 bg-neon-green/[0.1] text-white/78"
                      : "border-white/[0.06] bg-white/[0.03] text-white/34 hover:text-white/58"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setCenterTab("editor")}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-medium transition-all",
                    centerTab === "editor"
                      ? "border-neon-cyan/24 bg-neon-cyan/[0.1] text-white/78"
                      : "border-white/[0.06] bg-white/[0.03] text-white/34 hover:text-white/58"
                  )}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Editor
                </button>
                <div className="hidden min-w-0 items-center gap-2 lg:flex">
                  <div className="h-4 w-px bg-white/[0.06]" />
                  <span className="truncate text-[11px] text-white/28">
                    {activeFilePath ?? (hasFiles ? "Selecione um arquivo para editar" : "Ainda nao existem arquivos")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {centerTab === "preview" ? (
                  <>
                    <div className="flex max-w-[260px] items-center gap-1 overflow-x-auto rounded-full border border-white/[0.06] bg-white/[0.03] p-1">
                      {PREVIEW_VIEWPORTS.map((viewport) => {
                        const Icon = viewport.icon;
                        const isActive = viewport.value === previewViewport;

                        return (
                          <button
                            key={viewport.value}
                            type="button"
                            onClick={() => setPreviewViewport(viewport.value)}
                            className={cn(
                              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] transition-all",
                              isActive
                                ? "bg-white/[0.08] text-white/80"
                                : "text-white/32 hover:text-white/58"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {viewport.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/34 transition-colors hover:text-white/58"
                      title="Recarregar preview"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setWordWrap((v) => !v)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/34 transition-colors hover:text-white/58",
                        wordWrap && "border-neon-cyan/20 bg-neon-cyan/[0.1] text-neon-cyan/80"
                      )}
                      title="Word wrap"
                    >
                      <WrapText className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/34 transition-colors hover:text-white/58"
                      title="Copiar arquivo"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-neon-green" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {centerTab === "editor" ? (
              selectedFile ? (
                <>
                  <div className="flex h-9 items-center gap-0 border-b border-white/[0.05] bg-[oklch(0.072_0_0)]">
                    <div className="flex h-full min-w-0 items-center overflow-x-auto">
                      {openTabs.map((tab) => {
                        const tabPath = tab.path ?? tab.name;
                        const isActive = tabPath === (selectedFile.path ?? selectedFile.name);

                        return (
                          <button
                            key={tabPath}
                            type="button"
                            onClick={() => {
                              setSelectedFile(tab);
                              setCopied(false);
                              setCenterTab("editor");
                            }}
                            title={tabPath}
                            className={cn(
                              "group flex h-full items-center gap-2 border-r border-white/[0.03] px-3 text-[11px] transition-colors",
                              isActive
                                ? "border-b-2 border-b-neon-cyan/40 bg-white/[0.03] font-medium text-white/70"
                                : "text-white/30 hover:bg-white/[0.02] hover:text-white/50"
                            )}
                          >
                            <FileCode className={cn("h-3 w-3", isActive ? getExtColor(tab.extension) : "text-white/20")} />
                            {tab.name}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseTab(tabPath);
                              }}
                              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-white/30 opacity-0 transition-all hover:bg-white/[0.08] hover:text-white/50 group-hover:opacity-100"
                            >
                              &times;
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-[oklch(0.08_0_0)]">
                    <div className="min-h-full p-4">
                      <table className="w-full border-collapse">
                        <tbody>
                          {lines.map((line, i) => (
                            <tr key={i} className="group hover:bg-white/[0.015]">
                              <td
                                className="select-none pr-4 text-right align-top font-mono text-[11px] leading-5 text-white/30 group-hover:text-white/25"
                                style={{ width: 44 }}
                              >
                                {i + 1}
                              </td>
                              <td
                                className={cn(
                                  "font-mono text-[12px] leading-5 text-white/75",
                                  wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                                )}
                              >
                                {line || "\u00A0"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex h-7 items-center justify-between border-t border-white/[0.05] bg-[oklch(0.065_0_0)] px-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-white/20">
                        <Terminal className="h-3 w-3" />
                        {lines.length} linhas
                      </span>
                      <span className="text-[10px] text-white/12">UTF-8</span>
                    </div>
                    <span className={cn("font-mono text-[10px] font-semibold", getExtColor(selectedFile.extension))}>
                      {selectedFile.extension?.toUpperCase() ?? "TXT"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <FileCode className="h-7 w-7 text-neon-cyan/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/25">Abra um arquivo para editar</p>
                    <p className="mt-1 max-w-xs text-[11px] text-white/30">
                      Selecione um arquivo no explorer ou gere uma nova estrutura pelo assistente.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div
                data-tour="code-preview"
                className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_32%),oklch(0.08_0_0)]"
              >
                <div className="flex min-h-full flex-col px-4 py-5 sm:px-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/24">
                        Visual validation
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-white/78">
                        Preview central para testar a interface com mais contexto
                      </h2>
                      <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/36">
                        O preview fica no centro para voce iterar em tempo real enquanto o chat define estrutura, comportamento e refinamentos visuais.
                      </p>
                    </div>

                    {activeFilePath ? (
                      <button
                        type="button"
                        onClick={() => setCenterTab("editor")}
                        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-[11px] font-medium text-white/58 transition-colors hover:text-white/78"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        Abrir {selectedFile?.name ?? "arquivo"}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-1 items-start justify-center overflow-auto pb-4">
                    {hasFiles ? (
                      <div className="flex w-full justify-center">
                        <div className={cn("w-full", activePreviewViewport.widthClass)}>
                          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[11px] text-white/38">
                            <div className="flex min-w-0 items-center gap-2">
                              <Circle className="h-2 w-2 fill-neon-green text-neon-green" />
                              <span className="truncate">
                                {activeFilePath ?? "index.html"}
                              </span>
                            </div>
                            <span className="shrink-0 text-white/24">
                              {activePreviewViewport.label}
                            </span>
                          </div>

                          <div className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
                            <div
                              className={cn(
                                "relative mx-auto overflow-hidden bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
                                activePreviewViewport.containerClass,
                                previewViewport === "desktop" && "rounded-[24px]",
                                previewViewport === "tablet" && "rounded-[30px]",
                                previewViewport === "mobile" && "rounded-[36px] border-[6px] border-white/[0.08]"
                              )}
                            >
                              {previewViewport === "mobile" ? (
                                <div className="pointer-events-none absolute left-1/2 top-3 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/[0.08]" />
                              ) : null}
                              <iframe
                                key={previewKey}
                                srcDoc={previewHtml}
                                title="Preview"
                                className="h-full w-full border-0 bg-black"
                                sandbox="allow-scripts"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-[30px] border border-white/[0.07] bg-white/[0.03] px-8 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                          <Sparkles className="h-7 w-7 text-neon-green/30" />
                        </div>
                        <h3 className="mt-5 text-xl font-semibold text-white/78">
                          Comece pelo brief e descreva o que precisa
                        </h3>
                        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/36">
                          Defina formato, stack, viewport e direcao visual no painel do assistente. Em seguida, descreva o produto, a tela ou o componente que deve ser criado.
                        </p>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                          {briefSummary.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/46"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel — Assistant */}
          <AnimatePresence initial={false}>
            {rightPanelOpen && (
              <motion.div
                data-tour="code-chat"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 420, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-shrink-0 flex-col overflow-hidden border-l border-white/[0.05] bg-[oklch(0.065_0_0)]"
              >
                <div className="flex h-12 items-center justify-between border-b border-white/[0.05] px-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/24">
                      Code copilot
                    </p>
                    <p className="truncate text-[12px] text-white/44">
                      Brief, contexto do projeto e conversa em um unico fluxo
                    </p>
                  </div>
                  <div className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/36">
                    {hasFiles ? `${files.size} arquivos` : "Sem arquivos"}
                  </div>
                </div>

                <div className="border-b border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setBriefOpen((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                        <LayoutTemplate className="h-4 w-4 text-neon-cyan/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/24">
                          Brief de geracao
                        </p>
                        <p className="truncate text-[12px] text-white/42">
                          {briefSummary.join(" · ")}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-white/28 transition-transform",
                        briefOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {briefOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-3 px-4 pb-4">
                          <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1.5">
                              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/24">
                                <Layers3 className="h-3.5 w-3.5" />
                                Formato
                              </span>
                              <select
                                value={projectBrief.surface}
                                onChange={(event) =>
                                  setProjectBrief((current) => ({
                                    ...current,
                                    surface: event.target.value as CodeSurface,
                                  }))
                                }
                                className="h-10 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-white/70 outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16]"
                              >
                                {SURFACE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-1.5">
                              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/24">
                                <Blocks className="h-3.5 w-3.5" />
                                Stack
                              </span>
                              <select
                                value={projectBrief.stack}
                                onChange={(event) =>
                                  setProjectBrief((current) => ({
                                    ...current,
                                    stack: event.target.value as CodeStack,
                                  }))
                                }
                                className="h-10 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-white/70 outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16]"
                              >
                                {STACK_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1.5">
                              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/24">
                                <Smartphone className="h-3.5 w-3.5" />
                                Prioridade
                              </span>
                              <select
                                value={projectBrief.viewport}
                                onChange={(event) =>
                                  setProjectBrief((current) => ({
                                    ...current,
                                    viewport: event.target.value as CodeViewportTarget,
                                  }))
                                }
                                className="h-10 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-white/70 outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16]"
                              >
                                {VIEWPORT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-1.5">
                              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/24">
                                <Brush className="h-3.5 w-3.5" />
                                Estetica
                              </span>
                              <select
                                value={projectBrief.aesthetic}
                                onChange={(event) =>
                                  setProjectBrief((current) => ({
                                    ...current,
                                    aesthetic: event.target.value as CodeAesthetic,
                                  }))
                                }
                                className="h-10 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-[12px] text-white/70 outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16]"
                              >
                                {AESTHETIC_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-white/24">
                              Contexto extra
                            </span>
                            <textarea
                              value={projectBrief.notes}
                              onChange={(event) =>
                                setProjectBrief((current) => ({
                                  ...current,
                                  notes: event.target.value,
                                }))
                              }
                              rows={3}
                              placeholder="Ex.: hero com alto contraste, animacao sutil, foco em conversao, area de pricing e FAQ."
                              className="w-full resize-none rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-white/70 placeholder:text-white/18 outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16]"
                            />
                          </label>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="border-b border-white/[0.05] px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {briefSummary.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/40"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-1 text-[11px] text-white/34">
                    <p>Arquivo em foco: {activeFilePath ?? "Nenhum selecionado"}</p>
                    <p>Arquivos no contexto: {files.size}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => {
                      const isAssistant = msg.role === "assistant";
                      const surfaceText = isAssistant
                        ? getChatSurfaceText(msg.content)
                        : msg.content;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-2.5",
                            msg.role === "user" && "flex-row-reverse"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border",
                              isAssistant
                                ? "border-neon-cyan/18 bg-neon-cyan/[0.08]"
                                : "border-white/[0.07] bg-white/[0.04]"
                            )}
                          >
                            {isAssistant ? (
                              <Bot className="h-3.5 w-3.5 text-neon-cyan/70" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-white/42" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "max-w-[92%] rounded-[22px] border px-3.5 py-3",
                                isAssistant
                                  ? "border-white/[0.07] bg-white/[0.04] text-white/68"
                                  : "ml-auto border-neon-cyan/18 bg-neon-cyan/[0.08] text-white/78"
                              )}
                            >
                              <p className="whitespace-pre-wrap text-[12px] leading-relaxed">
                                {surfaceText ||
                                  (msg.activity?.status === "streaming"
                                    ? "Trabalhando nas alteracoes..."
                                    : "Resposta pronta. Veja os arquivos gerados no editor e no preview.")}
                              </p>

                              {isAssistant && (msg.provider || msg.model) ? (
                                <p className="mt-2 text-[10px] text-white/28">
                                  {[msg.provider, msg.model].filter(Boolean).join(" · ")}
                                </p>
                              ) : null}
                            </div>

                            {isAssistant && msg.activity ? (
                              <WorkActivityCard
                                activity={msg.activity}
                                onOpenFile={selectFileByPath}
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={chatEndRef} />
                  </div>
                </div>

                <div className="border-t border-white/[0.05] p-3">
                  <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-3.5 py-2 text-[10px] text-white/28">
                      <span>{hasFiles ? "Pedir alteracoes adicionais" : "Descrever o primeiro projeto"}</span>
                      <span>{isSending ? "Gerando..." : "Enter envia"}</span>
                    </div>

                    <div className="px-3.5 pb-3 pt-2.5">
                      <textarea
                        ref={composerRef}
                        rows={1}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (isSending) {
                              handleAbortStream();
                              return;
                            }
                            handleSendChat();
                          }
                        }}
                        placeholder={
                          hasFiles
                            ? "Ex.: transforme em dashboard premium, adicione sidebar, hero responsivo e cards com dados reais."
                            : "Ex.: crie uma landing page premium para um SaaS de IA com hero, features, pricing e FAQ."
                        }
                        className="max-h-[164px] min-h-[96px] w-full resize-none bg-transparent text-[12px] leading-relaxed text-white/72 placeholder:text-white/18 outline-none"
                      />

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-white/26">
                          Shift + Enter quebra linha
                        </div>

                        <button
                          type="button"
                          onClick={isSending ? handleAbortStream : handleSendChat}
                          disabled={!isSending && !chatInput.trim()}
                          className={cn(
                            "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3.5 text-[11px] font-medium transition-all",
                            isSending
                              ? "border-white/[0.12] bg-white/[0.06] text-white/82 hover:bg-white/[0.1]"
                              : "border-neon-cyan/18 bg-neon-cyan/[0.12] text-neon-cyan/80 hover:bg-neon-cyan/[0.18]",
                            !isSending && !chatInput.trim() && "opacity-30"
                          )}
                        >
                          {isSending ? (
                            <>
                              <Square className="h-3 w-3 fill-current" />
                              Parar
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              Gerar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
