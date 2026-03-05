import type {
  AgentGroup,
  AgentInstance,
  AgentOutput,
} from "@/types/agent";
import type {
  DecompositionResult,
  Intent,
  TokenAnalysis,
} from "@/types/decomposition";
import type { ProviderName } from "@/types/provider";
import type { Message, Session } from "@/types/session";
import type {
  RuntimeFunctionKey,
  RuntimeLanguage,
  RuntimeTask,
} from "@/types/runtime";
import { useAgentStore } from "@/stores/agent-store";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { JOURNEY_STEPS } from "@/lib/journey";

/** Read the user's configured provider/model from the ecosystem config store. */
function getConfiguredProviderModel(): { provider: ProviderName; model: string } {
  const { ecosystemConfig } = useChatSettingsStore.getState();
  if (ecosystemConfig.provider && ecosystemConfig.model) {
    return { provider: ecosystemConfig.provider, model: ecosystemConfig.model };
  }
  // Fallback — last resort defaults
  return { provider: "openai" as ProviderName, model: "gpt-4o" };
}

interface MetricSnapshot {
  contexts: number;
  projects: number;
  agents: number;
  groups: number;
}

interface OrchestrationRunOptions {
  language?: RuntimeLanguage;
}

const AGENT_BLUEPRINTS: Record<
  Intent,
  { name: string; role: string }[]
> = {
  create: [
    { name: "Planner", role: "Arquiteto de plano" },
    { name: "Builder", role: "Executor tecnico" },
    { name: "Critic", role: "Validador de qualidade" },
  ],
  analyze: [
    { name: "Researcher", role: "Mapeador de fontes" },
    { name: "Analyst", role: "Interpretador de dados" },
    { name: "Synthesizer", role: "Consolidador de insights" },
  ],
  transform: [
    { name: "Planner", role: "Arquiteto de plano" },
    { name: "Builder", role: "Executor tecnico" },
    { name: "Critic", role: "Validador de qualidade" },
  ],
  question: [
    { name: "Researcher", role: "Mapeador de fontes" },
    { name: "Analyst", role: "Interpretador de dados" },
    { name: "Synthesizer", role: "Consolidador de insights" },
  ],
  explore: [
    { name: "Researcher", role: "Mapeador de fontes" },
    { name: "Designer", role: "Modelador de alternativas" },
    { name: "Synthesizer", role: "Consolidador de insights" },
  ],
  fix: [
    { name: "Debugger", role: "Resolvedor de erros" },
    { name: "Builder", role: "Executor tecnico" },
    { name: "Critic", role: "Validador de qualidade" },
  ],
  compare: [
    { name: "Researcher", role: "Mapeador de fontes" },
    { name: "Analyst", role: "Interpretador de dados" },
    { name: "Judge", role: "Avaliador de trade-offs" },
  ],
  summarize: [
    { name: "Researcher", role: "Mapeador de fontes" },
    { name: "Synthesizer", role: "Consolidador de insights" },
    { name: "Editor", role: "Refinador de comunicacao" },
  ],
  design: [
    { name: "Designer", role: "Modelador de UX" },
    { name: "Builder", role: "Executor tecnico" },
    { name: "Critic", role: "Validador de qualidade" },
  ],
  execute: [
    { name: "Planner", role: "Arquiteto de plano" },
    { name: "Builder", role: "Executor tecnico" },
    { name: "Operator", role: "Condutor de execucao" },
  ],
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  backend: ["api", "backend", "server", "auth", "oauth", "endpoint"],
  frontend: ["ui", "ux", "frontend", "layout", "design", "landing"],
  data: ["dados", "dataset", "analytics", "etl", "pipeline"],
  ai: ["ai", "agent", "modelo", "llm", "prompt", "chat"],
  product: ["produto", "roadmap", "projeto", "feature"],
};

const STAGE_BY_FUNCTION: Record<
  RuntimeFunctionKey,
  "decomposing" | "routing" | "spawning" | "executing" | "aggregating"
> = {
  contexts: "decomposing",
  projects: "routing",
  agents: "spawning",
  groups: "executing",
  aggregation: "aggregating",
};

const JOURNEY_STEP_BY_FUNCTION: Record<RuntimeFunctionKey, "contexts" | "agents" | "projects" | "groups" | "flows"> = {
  contexts: "contexts",
  projects: "projects",
  agents: "agents",
  groups: "groups",
  aggregation: "flows",
};

const TASK_TEMPLATES: Array<{
  functionKey: RuntimeFunctionKey;
  labels: Record<RuntimeLanguage, string>;
}> = [
  {
    functionKey: "contexts",
    labels: {
      "pt-BR": "Mapear contexto semantico",
      "en-US": "Map semantic context",
      "es-ES": "Mapear contexto semántico",
    },
  },
  {
    functionKey: "projects",
    labels: {
      "pt-BR": "Definir objetivo de projeto",
      "en-US": "Define project objective",
      "es-ES": "Definir objetivo del proyecto",
    },
  },
  {
    functionKey: "agents",
    labels: {
      "pt-BR": "Delegar funcoes para agentes",
      "en-US": "Delegate functions to agents",
      "es-ES": "Delegar funciones a agentes",
    },
  },
  {
    functionKey: "groups",
    labels: {
      "pt-BR": "Sincronizar grupos de execucao",
      "en-US": "Synchronize execution groups",
      "es-ES": "Sincronizar grupos de ejecución",
    },
  },
  {
    functionKey: "aggregation",
    labels: {
      "pt-BR": "Agregacao e resposta final",
      "en-US": "Aggregate and deliver final answer",
      "es-ES": "Agregar y entregar respuesta final",
    },
  },
];

const FUNCTION_AGENT_PREFERENCE: Record<RuntimeFunctionKey, string[]> = {
  contexts: ["Researcher", "Analyst", "Planner"],
  projects: ["Planner", "Builder", "Operator"],
  agents: ["Builder", "Operator", "Designer", "Debugger"],
  groups: ["Critic", "Judge", "Synthesizer"],
  aggregation: ["Synthesizer", "Editor", "Analyst", "Planner"],
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function toSessionTitle(prompt: string) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "Nova sessao";
  }
  if (compact.length <= 52) {
    return compact;
  }
  return `${compact.slice(0, 49)}...`;
}

export function createSession(
  sessionId: string,
  prompt: string,
  workspaceId?: string
): Session {
  const now = new Date();
  return {
    id: sessionId,
    title: toSessionTitle(prompt),
    status: "active",
    ...(workspaceId ? { workspaceId } : {}),
    metadata: {
      source: "chat",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createMessage(
  sessionId: string,
  role: Message["role"],
  content: string,
  metadata?: Record<string, unknown>
): Message {
  return {
    id: createId("msg"),
    sessionId,
    role,
    content,
    metadata,
    createdAt: new Date(),
  };
}

function detectIntent(prompt: string): Intent {
  const normalized = prompt.toLowerCase();

  if (/(criar|build|construir|develop|implementar)/.test(normalized)) {
    return "create";
  }
  if (/(analisar|diagnosticar|debug|erro)/.test(normalized)) {
    return "analyze";
  }
  if (/(corrigir|fix|ajustar|resolver)/.test(normalized)) {
    return "fix";
  }
  if (/(comparar|versus|vs)/.test(normalized)) {
    return "compare";
  }
  if (/(sumari|resumo|resumir)/.test(normalized)) {
    return "summarize";
  }
  if (/(design|layout|ux|ui)/.test(normalized)) {
    return "design";
  }
  if (/(transform|converter|migrar)/.test(normalized)) {
    return "transform";
  }
  if (/(executar|run|deploy|publicar)/.test(normalized)) {
    return "execute";
  }
  if (/(explorar|investigar|pesquisar)/.test(normalized)) {
    return "explore";
  }

  return "question";
}

function classifyDomains(prompt: string) {
  const normalized = prompt.toLowerCase();
  const matches = Object.entries(DOMAIN_KEYWORDS)
    .map(([domain, words]) => {
      const hits = words.filter((word) => normalized.includes(word)).length;
      return {
        domain,
        hits,
      };
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((entry) => ({
      domain: entry.domain,
      confidence: Math.min(0.98, 0.55 + entry.hits * 0.18),
    }));

  if (matches.length === 0) {
    return [
      {
        domain: "general",
        confidence: 0.62,
      },
    ];
  }

  return matches;
}

function tokenizePrompt(prompt: string): TokenAnalysis[] {
  const tokens = prompt
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 24);

  return tokens.map((token, index) => ({
    token,
    position: index,
    weight: Math.max(0.35, 1 - index * 0.03),
    role: index === 0 ? "subject" : index === 1 ? "action" : "object",
    dependencies: index === 0 ? [] : [index - 1],
    tags: [
      token.length > 7 ? "long" : "short",
      /^[A-Z]/.test(token) ? "entity" : "term",
    ],
  }));
}

function buildDecomposition(prompt: string): DecompositionResult {
  const intent = detectIntent(prompt);
  const tokens = tokenizePrompt(prompt);
  const domains = classifyDomains(prompt);
  const complexity = Math.min(0.95, 0.45 + tokens.length * 0.02);

  return {
    id: createId("decomp"),
    inputText: prompt,
    tokens,
    intent: {
      primary: intent,
      secondary: ["explore", "analyze"].filter(
        (item): item is Intent => item !== intent
      ),
      confidence: Math.min(0.99, 0.65 + tokens.length * 0.01),
      actionVerbs: tokens
        .map((token) => token.token)
        .filter((token) => /(ar|er|ir|ing)$/i.test(token))
        .slice(0, 3),
      targetNouns: tokens
        .map((token) => token.token)
        .filter((token) => token.length > 4)
        .slice(0, 4),
    },
    polarity: {
      sentiment: 0.2,
      urgency: Math.min(1, 0.35 + prompt.length / 360),
      certainty: 0.72,
      formality: 0.58,
      complexity,
    },
    context: {
      domains,
      entities: tokens.slice(0, 3).map((token) => ({
        name: token.token,
        type: "concept" as const,
        relevance: Math.max(0.4, token.weight),
      })),
      implicitAssumptions: [
        "Existe acesso aos provedores configurados",
        "A resposta deve manter foco no objetivo principal",
      ],
      requiredKnowledge: [
        "Arquitetura do projeto",
        "Comportamento esperado da feature",
      ],
      outputFormat: "text",
    },
    taskRouting: {
      requiredAgents: (AGENT_BLUEPRINTS[intent] ?? AGENT_BLUEPRINTS.question).map(
        (agent, index) => ({
          templateId: agent.name.toLowerCase(),
          reason: agent.role,
          priority: index + 1,
          suggestedModel: getConfiguredProviderModel().model,
          suggestedProvider: getConfiguredProviderModel().provider,
          inputContext: prompt,
        })
      ),
      executionStrategy:
        intent === "analyze" || intent === "compare" ? "consensus" : "pipeline",
      estimatedComplexity: complexity,
      suggestedGrouping: [
        {
          name: "Core Workflow",
          agentIndices: [0, 1, 2],
        },
      ],
    },
    timestamp: Date.now(),
  };
}

function ensureAgentsForSession(
  sessionId: string,
  intent: Intent
): { agents: AgentInstance[]; group: AgentGroup } {
  const agentStore = useAgentStore.getState();
  const existingAgents = agentStore.agents.filter(
    (agent) => agent.sessionId === sessionId
  );
  const existingGroup = agentStore.groups.find(
    (group) => group.sessionId === sessionId
  );

  if (existingAgents.length > 0) {
    if (existingGroup) {
      return {
        agents: existingAgents,
        group: existingGroup,
      };
    }

    const fallbackGroup: AgentGroup = {
      id: createId("group"),
      sessionId,
      name: `${intent} workflow`,
      strategy: "sequential",
      agentIds: existingAgents.map((agent) => agent.id),
      createdAt: new Date(),
    };

    agentStore.addGroup(fallbackGroup);

    return {
      agents: existingAgents,
      group: fallbackGroup,
    };
  }

  const now = new Date();
  const strategy =
    intent === "analyze" || intent === "compare" ? "consensus" : "pipeline";

  const mappedStrategy = strategy === "pipeline" ? "sequential" : strategy;

  const agents = (AGENT_BLUEPRINTS[intent] ?? AGENT_BLUEPRINTS.question).map(
    (blueprint, index) => {
      const agent: AgentInstance = {
        id: createId("agent"),
        sessionId,
        templateId: blueprint.name.toLowerCase(),
        name: blueprint.name,
        role: blueprint.role,
        status: "idle",
        provider: getConfiguredProviderModel().provider,
        model: getConfiguredProviderModel().model,
        systemPrompt: `You are ${blueprint.name}, focus on ${blueprint.role}.`,
        outputs: [],
        createdAt: now,
        updatedAt: now,
        config: {
          priority: index + 1,
        },
      };

      agentStore.addAgent(agent);
      return agent;
    }
  );

  const group: AgentGroup = {
    id: createId("group"),
    sessionId,
    name: `${intent} workflow`,
    strategy: mappedStrategy,
    agentIds: agents.map((agent) => agent.id),
    createdAt: now,
  };

  agentStore.addGroup(group);

  return {
    agents,
    group,
  };
}

function getSessionMetricSnapshot(
  sessionId: string,
  decompositionId: string,
  tasks: RuntimeTask[]
): MetricSnapshot {
  const decompositionState = useDecompositionStore.getState();
  const sessionState = useSessionStore.getState();
  const agentState = useAgentStore.getState();

  const sessionMessages = sessionState.messages.filter(
    (message) => message.sessionId === sessionId
  );
  const decompositionIds = new Set<string>();

  for (const message of sessionMessages) {
    if (message.decompositionId) {
      decompositionIds.add(message.decompositionId);
    }
    const metadataDecompositionId = message.metadata?.decompositionId;
    if (typeof metadataDecompositionId === "string") {
      decompositionIds.add(metadataDecompositionId);
    }
  }

  if (decompositionState.decompositions[decompositionId]) {
    decompositionIds.add(decompositionId);
  }

  const sessionAgents = agentState.agents.filter(
    (agent) => agent.sessionId === sessionId
  );
  const sessionGroups = agentState.groups.filter(
    (group) => group.sessionId === sessionId
  );

  return {
    contexts: Math.max(decompositionIds.size, 1),
    projects: sessionState.sessions.some((session) => session.id === sessionId)
      ? 1
      : 0,
    agents: Math.max(
      sessionAgents.length,
      new Set(tasks.map((task) => task.agentId)).size
    ),
    groups: Math.max(sessionGroups.length, 1),
  };
}

function pickAgentForFunction(
  agents: AgentInstance[],
  functionKey: RuntimeFunctionKey,
  usedAgentIds: Set<string>
): AgentInstance {
  const preferredNames = FUNCTION_AGENT_PREFERENCE[functionKey] ?? [];

  for (const name of preferredNames) {
    const preferredAgent = agents.find(
      (agent) => agent.name === name && !usedAgentIds.has(agent.id)
    );

    if (preferredAgent) {
      usedAgentIds.add(preferredAgent.id);
      return preferredAgent;
    }
  }

  const fallbackUnused = agents.find((agent) => !usedAgentIds.has(agent.id));
  if (fallbackUnused) {
    usedAgentIds.add(fallbackUnused.id);
    return fallbackUnused;
  }

  return agents[0];
}

function createRuntimeTasks(
  agents: AgentInstance[],
  language: RuntimeLanguage
): RuntimeTask[] {
  const usedAgentIds = new Set<string>();

  return TASK_TEMPLATES.map((template, index) => {
    const agent = pickAgentForFunction(agents, template.functionKey, usedAgentIds);

    return {
      id: createId("task"),
      title: template.labels[language],
      functionKey: template.functionKey,
      agentId: agent.id,
      agentName: agent.name,
      priority: index + 1,
      status: "pending",
      progress: 0,
      notes: [],
    };
  });
}

function createAgentOutput(
  sessionId: string,
  agent: AgentInstance,
  task: RuntimeTask,
  prompt: string,
  language: RuntimeLanguage
): AgentOutput {
  const languageName =
    language === "en-US"
      ? "English"
      : language === "es-ES"
      ? "Espanol"
      : "Portugues";

  return {
    id: createId("output"),
    agentId: agent.id,
    sessionId,
    type: "thought",
    content: `${task.title} executada por ${agent.name} em ${languageName}: ${prompt.slice(0, 120)}${prompt.length > 120 ? "..." : ""}`,
    metadata: {
      functionKey: task.functionKey,
      language,
      taskId: task.id,
    },
    createdAt: new Date(),
  };
}

function buildKickoffMessage(
  language: RuntimeLanguage,
  intent: Intent,
  tasks: RuntimeTask[]
) {
  const assignmentLines =
    tasks.length > 0
      ? tasks
          .map((task, index) => `${index + 1}. ${task.title} -> ${task.agentName}`)
          .join("\n")
      : language === "en-US"
      ? "Delegation is being rebuilt."
      : language === "es-ES"
      ? "La delegacion se esta reconstruyendo."
      : "A delegacao esta sendo reconstruida.";

  if (language === "en-US") {
    return [
      `Great. I understood your request with intent: ${intent}.`,
      `I will execute everything inside this chat and stream progress in real time.`,
      `Execution plan by delegated function:\n${assignmentLines}`,
      `Didactic path in progress: Contexts -> Agents -> Projects -> Groups -> Flows -> Orchestra.`,
      `While I work, you can reorder priorities, send notes, and adjust response language.`,
    ].join("\n\n");
  }

  if (language === "es-ES") {
    return [
      `Perfecto. Entendi tu solicitud con intencion: ${intent}.`,
      `Voy a ejecutar todo aqui en el chat y mostrar progreso en tiempo real.`,
      `Plan de ejecucion por funcion delegada:\n${assignmentLines}`,
      `Ruta didactica activa: Contextos -> Agentes -> Proyectos -> Grupos -> Flujos -> Orquestra.`,
      `Mientras ejecuto, puedes cambiar prioridades, enviar notas y ajustar el idioma de respuesta.`,
    ].join("\n\n");
  }

  return [
    `Perfeito. Entendi sua solicitacao com intencao: ${intent}.`,
    `Vou desenvolver aqui no chat e mostrar progresso em tempo real.`,
    `Plano de execucao por funcao delegada:\n${assignmentLines}`,
    `Trilha didatica ativa: Contextos -> Agentes -> Projetos -> Grupos -> Fluxos -> Orquestra.`,
    `Enquanto executo, voce pode reordenar prioridades, enviar notas e alterar a linguagem da resposta.`,
  ].join("\n\n");
}

function buildTaskCheckpointMessage(
  language: RuntimeLanguage,
  task: RuntimeTask,
  doneCount: number,
  totalCount: number
) {
  if (language === "en-US") {
    return [
      `Step ${doneCount}/${totalCount} completed.`,
      `Function: ${task.title}.`,
      `Responsible agent: ${task.agentName}.`,
      `Continuing to the next delegated function.`,
    ].join(" ");
  }

  if (language === "es-ES") {
    return [
      `Paso ${doneCount}/${totalCount} completado.`,
      `Funcion: ${task.title}.`,
      `Agente responsable: ${task.agentName}.`,
      `Continuando para la siguiente funcion delegada.`,
    ].join(" ");
  }

  return [
    `Etapa ${doneCount}/${totalCount} concluida.`,
    `Funcao: ${task.title}.`,
    `Agente responsavel: ${task.agentName}.`,
    `Seguindo para a proxima funcao delegada.`,
  ].join(" ");
}

function buildAssistantResponse(
  language: RuntimeLanguage,
  intent: Intent,
  metrics: MetricSnapshot,
  tasks: RuntimeTask[],
  noteCount: number,
  nextStepLabel: string | null
) {
  const assignments =
    tasks.length > 0
      ? tasks.map((task) => `${task.title} -> ${task.agentName}`).join(" | ")
      : language === "en-US"
      ? "Delegation was rebuilt during execution."
      : language === "es-ES"
      ? "La delegacion fue reconstruida durante la ejecucion."
      : "A delegacao foi reconstruida durante a execucao.";

  const taskSummary =
    tasks.length > 0
      ? tasks
          .map((task, index) => {
            const status = task.status === "done" ? "OK" : task.status.toUpperCase();
            return `${index + 1}. ${task.title} [${task.agentName}] - ${status}`;
          })
          .join("\n")
      : language === "en-US"
      ? "No task summary available."
      : language === "es-ES"
      ? "No hay resumen de tareas disponible."
      : "Nao ha resumo de tarefas disponivel.";

  if (language === "en-US") {
    return [
      `Execution complete. Intent detected: ${intent}.`,
      `Every function was delegated and executed by the proper agent directly in this chat.`,
      `Delegation map: ${assignments}.`,
      `Task-by-task trace:\n${taskSummary}`,
      `Live distribution now: contexts ${metrics.contexts}, projects ${metrics.projects}, agents ${metrics.agents}, groups ${metrics.groups}.`,
      `Notes received during execution: ${noteCount}.`,
      nextStepLabel
        ? `Next connected step: ${nextStepLabel}. Use the button below to continue the engine path.`
        : `All connected steps are completed. Use the button below to open orchestra.`,
    ].join("\n\n");
  }

  if (language === "es-ES") {
    return [
      `Ejecucion completada. Intencion detectada: ${intent}.`,
      `Cada funcion fue delegada y ejecutada por su agente dentro del chat.`,
      `Mapa de delegacion: ${assignments}.`,
      `Trazado por tareas:\n${taskSummary}`,
      `Distribucion en vivo: contextos ${metrics.contexts}, proyectos ${metrics.projects}, agentes ${metrics.agents}, grupos ${metrics.groups}.`,
      `Notas recibidas durante la ejecucion: ${noteCount}.`,
      nextStepLabel
        ? `Siguiente paso conectado: ${nextStepLabel}. Usa el boton abajo para continuar la engranaje.`
        : `Todos los pasos conectados fueron completados. Usa el boton para abrir orquestra.`,
    ].join("\n\n");
  }

  return [
    `Execucao concluida. Intencao detectada: ${intent}.`,
    `Cada funcao foi delegada e executada pelo agente certo, aqui no chat.`,
    `Mapa de delegacao: ${assignments}.`,
    `Rastro por tarefa:\n${taskSummary}`,
    `Distribuicao ao vivo agora: contextos ${metrics.contexts}, projetos ${metrics.projects}, agentes ${metrics.agents}, grupos ${metrics.groups}.`,
    `Notas recebidas durante a execucao: ${noteCount}.`,
    nextStepLabel
      ? `Proxima etapa conectada: ${nextStepLabel}. Use o botao abaixo para seguir a engrenagem.`
      : `Todas as etapas conectadas foram concluidas. Use o botao para abrir a orquestra.`,
  ].join("\n\n");
}

function getPipelineProgressFromRuntime(sessionId: string) {
  const runtimeStore = useRuntimeStore.getState();
  const runtime = runtimeStore.getSession(sessionId);

  return runtime?.overallProgress ?? 0;
}

export async function runChatOrchestration(
  sessionId: string,
  prompt: string,
  options?: OrchestrationRunOptions
): Promise<void> {
  const pipelineStore = usePipelineStore.getState();
  const sessionStore = useSessionStore.getState();
  const decompositionStore = useDecompositionStore.getState();
  const agentStore = useAgentStore.getState();
  const runtimeStore = useRuntimeStore.getState();

  runtimeStore.ensureSession(sessionId);

  const selectedLanguage =
    options?.language ?? runtimeStore.getSession(sessionId)?.language ?? "pt-BR";

  runtimeStore.setLanguage(sessionId, selectedLanguage);
  runtimeStore.setDistributionReady(sessionId, false);
  runtimeStore.setRunning(sessionId, true);

  pipelineStore.setStage("intake");
  pipelineStore.setProgress(8);
  pipelineStore.addEvent({
    type: "stage_change",
    data: { stage: "intake", sessionId },
    timestamp: Date.now(),
  });

  await delay(120);

  pipelineStore.setStage("decomposing");
  pipelineStore.setProgress(20);

  const decomposition = buildDecomposition(prompt);
  decompositionStore.addDecomposition(decomposition);
  runtimeStore.markJourneyStepVisited(sessionId, "contexts");
  pipelineStore.addEvent({
    type: "decomposition",
    data: {
      decompositionId: decomposition.id,
      intent: decomposition.intent.primary,
    },
    timestamp: Date.now(),
  });

  await delay(120);

  const { agents, group } = ensureAgentsForSession(
    sessionId,
    decomposition.intent.primary
  );

  const runId = createId("run");
  const tasks = createRuntimeTasks(agents, selectedLanguage);
  runtimeStore.startRun(sessionId, runId, tasks, selectedLanguage);

  const kickoffMessage = createMessage(
    sessionId,
    "assistant",
    buildKickoffMessage(
      selectedLanguage,
      decomposition.intent.primary,
      tasks
    ),
    {
      kickoff: true,
      runId,
      decompositionId: decomposition.id,
    }
  );

  sessionStore.addMessage(kickoffMessage);

  pipelineStore.setStage("routing");
  pipelineStore.setProgress(28);
  pipelineStore.addEvent({
    type: "routing",
    data: {
      groupId: group.id,
      strategy: group.strategy,
      agentCount: agents.length,
      runId,
    },
    timestamp: Date.now(),
  });

  for (;;) {
    let runtime = runtimeStore.getSession(sessionId);
    if (!runtime || runtime.tasks.length === 0) {
      runtimeStore.startRun(sessionId, runId, tasks, selectedLanguage);
      runtime = runtimeStore.getSession(sessionId);
    }

    const nextTask = runtime?.tasks.find((task) => task.status === "pending");

    if (!runtime || !nextTask) {
      break;
    }

    const stage = STAGE_BY_FUNCTION[nextTask.functionKey];
    pipelineStore.setStage(stage);
    runtimeStore.updateTask(sessionId, nextTask.id, {
      status: "running",
      progress: Math.max(nextTask.progress, 6),
    });

    const currentAgent = agents.find((agent) => agent.id === nextTask.agentId);
    if (currentAgent) {
      agentStore.updateAgent(currentAgent.id, {
        status: "working",
        updatedAt: new Date(),
      });
    }

    for (const step of [22, 46, 68, 86, 100]) {
      await delay(90);
      runtimeStore.updateTask(sessionId, nextTask.id, {
        progress: step,
      });

      pipelineStore.setProgress(
        Math.max(10, getPipelineProgressFromRuntime(sessionId))
      );
    }

    runtimeStore.updateTask(sessionId, nextTask.id, {
      status: "done",
      progress: 100,
    });
    runtimeStore.markJourneyStepVisited(
      sessionId,
      JOURNEY_STEP_BY_FUNCTION[nextTask.functionKey]
    );

    const updatedRuntime = runtimeStore.getSession(sessionId);
    const doneCount =
      updatedRuntime?.tasks.filter((task) => task.status === "done").length ?? 0;

    sessionStore.addMessage(
      createMessage(
        sessionId,
        "system",
        buildTaskCheckpointMessage(
          selectedLanguage,
          nextTask,
          doneCount,
          Math.max(tasks.length, 1)
        ),
        {
          checkpoint: true,
          runId,
          functionKey: nextTask.functionKey,
          taskId: nextTask.id,
        }
      )
    );

    if (currentAgent) {
      const output = createAgentOutput(
        sessionId,
        currentAgent,
        nextTask,
        prompt,
        selectedLanguage
      );

      agentStore.addOutput(currentAgent.id, output);
      agentStore.updateAgent(currentAgent.id, {
        status: "done",
        updatedAt: new Date(),
      });

      pipelineStore.addEvent({
        type: "agent_output",
        data: {
          agentId: currentAgent.id,
          outputId: output.id,
          functionKey: nextTask.functionKey,
          runId,
        },
        timestamp: Date.now(),
      });
    }

    pipelineStore.setProgress(
      Math.max(12, getPipelineProgressFromRuntime(sessionId))
    );
  }

  runtimeStore.completeRun(sessionId);

  pipelineStore.setStage("aggregating");
  pipelineStore.setProgress(96);

  const metrics = getSessionMetricSnapshot(sessionId, decomposition.id, tasks);
  const finalRuntime = runtimeStore.getSession(sessionId);
  const finalTasks =
    finalRuntime?.tasks && finalRuntime.tasks.length > 0
      ? finalRuntime.tasks
      : tasks;
  const noteCount = finalRuntime?.notes.length ?? 0;
  const nextJourneyStep =
    finalRuntime && finalRuntime.journeyCursor < JOURNEY_STEPS.length
      ? JOURNEY_STEPS[finalRuntime.journeyCursor]
      : null;

  const assistantMessage = createMessage(
    sessionId,
    "assistant",
    buildAssistantResponse(
      selectedLanguage,
      decomposition.intent.primary,
      metrics,
      finalTasks,
      noteCount,
      nextJourneyStep?.label ?? null
    ),
    {
      includeDistribution: true,
      includeJourney: true,
      intent: decomposition.intent.primary,
      strategy: group.strategy,
      language: selectedLanguage,
      runId,
      decompositionId: decomposition.id,
      journeyNextStep: nextJourneyStep?.key ?? null,
    }
  );

  sessionStore.addMessage(assistantMessage);
  sessionStore.updateSession(sessionId, {
    updatedAt: new Date(),
  });

  pipelineStore.addEvent({
    type: "pipeline_complete",
    data: {
      sessionId,
      assistantMessageId: assistantMessage.id,
      runId,
    },
    timestamp: Date.now(),
  });

  pipelineStore.setStage("complete");
  pipelineStore.setProgress(100);

  runtimeStore.setRunning(sessionId, false);

  setTimeout(() => {
    const latest = usePipelineStore.getState();
    if (latest.stage === "complete") {
      latest.setStage("idle");
      latest.setProgress(0);
    }
  }, 700);
}

/* ------------------------------------------------------------------ */
/*  Simple chat mode — conversational response without full pipeline  */
/* ------------------------------------------------------------------ */

const FACTUAL_RESPONSES: Array<{ test: (q: string) => boolean; answer: string }> = [
  {
    test: (q) => /quantas?\s+pessoas|popula[cç][aã]o/.test(q) && /brasil/.test(q),
    answer: "O Brasil tem aproximadamente **215,3 milhoes de habitantes** (estimativa IBGE 2024). E o sexto pais mais populoso do mundo, atras de India, China, EUA, Indonesia e Paquistao. A maior concentracao esta no Sudeste, especialmente em Sao Paulo e Rio de Janeiro.",
  },
  {
    test: (q) => /capital\s+d[oe]/.test(q) && /brasil/.test(q),
    answer: "A capital do Brasil e **Brasilia**, localizada no Distrito Federal. Foi inaugurada em 21 de abril de 1960, projetada por Lucio Costa (urbanismo) e Oscar Niemeyer (arquitetura).",
  },
  {
    test: (q) => /quantos?\s+estados/.test(q) && /brasil/.test(q),
    answer: "O Brasil possui **26 estados** e **1 Distrito Federal**, totalizando 27 unidades federativas. O maior em area e o Amazonas, e o mais populoso e Sao Paulo.",
  },
  {
    test: (q) => /(?:o que|que)\s+[eé]/.test(q) && /(?:ia|inteligencia artificial)/.test(q),
    answer: "**Inteligencia Artificial (IA)** e um campo da ciencia da computacao que desenvolve sistemas capazes de realizar tarefas que normalmente requerem inteligencia humana — como aprendizado, raciocinio, percepcao e tomada de decisao. Inclui subcampos como machine learning, processamento de linguagem natural (NLP), visao computacional e redes neurais.",
  },
  {
    test: (q) => /(?:o que|que)\s+[eé]/.test(q) && /origem/.test(q),
    answer: "**ORIGEM** e uma plataforma de inteligencia artificial psicossemantica. Ela decompoe conceitos, orquestra agentes especializados e cria mapas de contexto para resolver problemas complexos. No modo 360, ativa todo o ecossistema de decomposicao, delegacao e sintese.",
  },
];

const TOPIC_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["conceito", "decompor", "decomposicao"],
    response: "Para decompor um conceito, identificamos seus elementos fundamentais e relacoes. Qual conceito voce quer explorar? Posso mapear dimensoes semanticas, contextos de uso e conexoes.\n\n> **Dica**: No modo **360**, a decomposicao e feita automaticamente por agentes especializados.",
  },
  {
    keywords: ["mapa", "contexto", "mapear"],
    response: "Vamos criar um mapa de contexto! Descreva o tema central e eu ajudarei a identificar nos semanticos, conexoes e camadas de significado.\n\n> **Dica**: No modo **360**, o mapeamento gera automaticamente projetos e tarefas delegadas.",
  },
  {
    keywords: ["agente", "orquestrar", "delegar"],
    response: "Posso ajudar com orquestracao! Descreva a tarefa e eu sugerirei quais agentes especializados usar e qual estrategia de execucao adotar.\n\n> **Dica**: No modo **360**, os agentes sao delegados e executados automaticamente.",
  },
  {
    keywords: ["projeto", "plano", "planejamento"],
    response: "Me conte mais sobre o projeto! Posso ajudar a estruturar etapas, definir objetivos e criar um plano de execucao eficiente.\n\n> **Dica**: No modo **360**, o planejamento gera contextos, agentes e pipeline automaticamente.",
  },
  {
    keywords: ["ideia", "criar", "novo", "inventar"],
    response: "Adorei! Me de mais detalhes sobre sua ideia e vamos construir juntos, passo a passo.\n\n> **Dica**: No modo **360**, sua ideia e decomposta, delegada a agentes e sintetizada automaticamente.",
  },
  {
    keywords: ["ajuda", "ajudar", "help"],
    response: "Claro! Estou aqui para ajudar. Voce pode me perguntar qualquer coisa — desde questoes factuais ate planejamento de projetos e decomposicao de conceitos.\n\nNo modo **Chat**, respondo diretamente. No modo **360**, ativo o ecossistema completo com agentes, decomposicao e pipeline.",
  },
  {
    keywords: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hey"],
    response: "Ola! Bem-vindo ao ORIGEM. Como posso ajudar? Pode fazer perguntas, pedir analises ou explorar conceitos comigo.\n\nEstou no modo **Chat** — respostas diretas e conversacionais.",
  },
];

function generateSimpleResponse(prompt: string): string {
  const lower = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Check factual knowledge base
  const factual = FACTUAL_RESPONSES.find((r) => r.test(lower));
  if (factual) return factual.answer;

  // 2. Check topic patterns
  const topic = TOPIC_RESPONSES.find((r) =>
    r.keywords.some((kw) => lower.includes(kw))
  );
  if (topic) return topic.response;

  // 3. Detect question patterns and give helpful generic response
  const isQuestion = lower.includes("?") ||
    /^(qual|quanto|quantas|como|por que|porque|onde|quando|quem|o que|que)\b/.test(lower);

  if (isQuestion) {
    return `Essa e uma otima pergunta! No momento, estou operando no modo **Chat direto** sem conexao com LLM externo.\n\nPara perguntas factuais e analises profundas, recomendo:\n1. Conectar um provedor de IA em **Settings > Providers**\n2. Ou mudar para o modo **360** para acionar o ecossistema completo de decomposicao e analise.\n\nMesmo assim, posso ajudar com planejamento, decomposicao de conceitos e organizacao de ideias!`;
  }

  // 4. Default conversational response
  return `Recebi sua mensagem! No modo **Chat**, respondo de forma direta e conversacional.\n\nPosso ajudar com:\n- Decomposicao de conceitos\n- Planejamento de projetos\n- Mapeamento de contextos\n- Perguntas sobre o ORIGEM\n\nPara analise profunda com agentes e pipeline, mude para o modo **360**.`;
}

export async function runSimpleChat(
  sessionId: string,
  prompt: string
): Promise<void> {
  const sessionStore = useSessionStore.getState();
  const runtimeStore = useRuntimeStore.getState();

  runtimeStore.ensureSession(sessionId);
  runtimeStore.setRunning(sessionId, true);

  let response: string;
  let metadata: Record<string, unknown> | undefined;

  try {
    // Try real LLM call
    const { useChatSettingsStore } = await import("@/stores/chat-settings-store");
    const { selectedTier, getActiveCritics } = useChatSettingsStore.getState();

    // Build conversation history for context
    const history = sessionStore.messages
      .filter((m) => m.sessionId === sessionId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

    const { ecosystemConfig } = useChatSettingsStore.getState();
    const hasManualSelection = ecosystemConfig.provider !== null && ecosystemConfig.model !== "";

    const { callChatCompletion } = await import("@/lib/chat-api");
    const result = await callChatCompletion({
      messages: history,
      ...(hasManualSelection
        ? { provider: ecosystemConfig.provider ?? undefined, model: ecosystemConfig.model }
        : { tier: selectedTier }),
      systemPrompt:
        "Voce e o ORIGEM, uma plataforma de IA psicossemantica. Responda em portugues brasileiro de forma clara, util e objetiva.",
    });

    response = result.content;

    // Run critic pipeline if critics are active
    const activeCritics = getActiveCritics();
    if (activeCritics.length > 0) {
      try {
        const { runCriticPipeline } = await import("@/lib/chat-api");
        const criticResults = await runCriticPipeline(
          response,
          activeCritics,
          selectedTier
        );
        if (criticResults.finalContent !== response) {
          metadata = {
            criticResults: criticResults.results,
            originalResponse: response,
          };
          response = criticResults.finalContent;
        } else {
          metadata = { criticResults: criticResults.results };
        }
      } catch {
        // Critic pipeline failed, use original response
      }
    }
  } catch {
    // Fallback to template response if no provider configured
    await delay(400 + Math.random() * 600);
    response = generateSimpleResponse(prompt);
  }

  sessionStore.addMessage(createMessage(sessionId, "assistant", response, metadata));
  sessionStore.updateSession(sessionId, { updatedAt: new Date() });
  runtimeStore.setRunning(sessionId, false);
}
