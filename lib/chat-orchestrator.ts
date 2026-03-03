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
import type { Message, Session } from "@/types/session";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useSessionStore } from "@/stores/session-store";

interface MetricSnapshot {
  contexts: number;
  projects: number;
  agents: number;
  groups: number;
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

export function createSession(sessionId: string, prompt: string): Session {
  const now = new Date();
  return {
    id: sessionId,
    title: toSessionTitle(prompt),
    status: "active",
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
  if (/(analisar|analisar|diagnosticar|debug|erro)/.test(normalized)) {
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
          suggestedModel: "gpt-4o",
          suggestedProvider: "openai",
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
        provider: "openai",
        model: "gpt-4o",
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
    name: `${toSessionTitle(intent)} workflow`,
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

function createAgentOutput(
  sessionId: string,
  agent: AgentInstance,
  prompt: string
): AgentOutput {
  return {
    id: createId("output"),
    agentId: agent.id,
    sessionId,
    type: "thought",
    content: `${agent.name} processou: ${prompt.slice(0, 120)}`,
    createdAt: new Date(),
  };
}

function getMetricSnapshot(): MetricSnapshot {
  const decompositions = useDecompositionStore.getState().decompositions;
  const sessions = useSessionStore.getState().sessions;
  const agentState = useAgentStore.getState();

  return {
    contexts: Object.keys(decompositions).length,
    projects: sessions.length,
    agents: agentState.agents.length,
    groups: agentState.groups.length,
  };
}

function buildAssistantResponse(
  prompt: string,
  intent: Intent,
  agentCount: number,
  strategy: AgentGroup["strategy"],
  metrics: MetricSnapshot
) {
  return [
    `Intencao detectada: ${intent}.`,
    `Pipeline executado com ${agentCount} agentes em estrategia ${strategy}.`,
    `Contexto processado: \"${prompt.slice(0, 120)}${prompt.length > 120 ? "..." : ""}\".`,
    `Distribuicao atual -> contextos: ${metrics.contexts}, projetos: ${metrics.projects}, agentes: ${metrics.agents}, grupos: ${metrics.groups}.`,
  ].join(" ");
}

export async function runChatOrchestration(
  sessionId: string,
  prompt: string
): Promise<void> {
  const pipelineStore = usePipelineStore.getState();
  const sessionStore = useSessionStore.getState();
  const decompositionStore = useDecompositionStore.getState();
  const agentStore = useAgentStore.getState();

  pipelineStore.setStage("intake");
  pipelineStore.setProgress(12);
  pipelineStore.addEvent({
    type: "stage_change",
    data: { stage: "intake", sessionId },
    timestamp: Date.now(),
  });

  await delay(140);

  pipelineStore.setStage("decomposing");
  pipelineStore.setProgress(36);

  const decomposition = buildDecomposition(prompt);
  decompositionStore.addDecomposition(decomposition);
  pipelineStore.addEvent({
    type: "decomposition",
    data: {
      decompositionId: decomposition.id,
      intent: decomposition.intent.primary,
    },
    timestamp: Date.now(),
  });

  await delay(140);

  pipelineStore.setStage("routing");
  pipelineStore.setProgress(58);

  const { agents, group } = ensureAgentsForSession(
    sessionId,
    decomposition.intent.primary
  );

  pipelineStore.addEvent({
    type: "routing",
    data: {
      groupId: group.id,
      strategy: group.strategy,
      agentCount: agents.length,
    },
    timestamp: Date.now(),
  });

  await delay(120);

  pipelineStore.setStage("spawning");
  pipelineStore.setProgress(72);

  agents.forEach((agent) => {
    agentStore.updateAgent(agent.id, {
      status: "working",
      updatedAt: new Date(),
    });
    pipelineStore.addEvent({
      type: "agent_spawned",
      data: {
        agentId: agent.id,
        name: agent.name,
      },
      timestamp: Date.now(),
    });
  });

  await delay(120);

  pipelineStore.setStage("executing");
  pipelineStore.setProgress(84);

  agents.forEach((agent) => {
    const output = createAgentOutput(sessionId, agent, prompt);
    agentStore.addOutput(agent.id, output);
    agentStore.updateAgent(agent.id, {
      status: "done",
      updatedAt: new Date(),
    });

    pipelineStore.addEvent({
      type: "agent_output",
      data: {
        agentId: agent.id,
        outputId: output.id,
      },
      timestamp: Date.now(),
    });
  });

  await delay(120);

  pipelineStore.setStage("aggregating");
  pipelineStore.setProgress(95);

  const metrics = getMetricSnapshot();

  const assistantMessage = createMessage(
    sessionId,
    "assistant",
    buildAssistantResponse(
      prompt,
      decomposition.intent.primary,
      agents.length,
      group.strategy,
      metrics
    ),
    {
      includeDistribution: true,
      intent: decomposition.intent.primary,
      strategy: group.strategy,
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
    },
    timestamp: Date.now(),
  });

  pipelineStore.setStage("complete");
  pipelineStore.setProgress(100);

  setTimeout(() => {
    const latest = usePipelineStore.getState();
    if (latest.stage === "complete") {
      latest.setStage("idle");
      latest.setProgress(0);
    }
  }, 700);
}
