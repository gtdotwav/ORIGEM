import { z } from "zod";

const DateValueSchema = z.union([z.string(), z.number(), z.date()]);

/** Accept null | undefined → normalize to undefined before validation */
const optStr = z.preprocess((v) => v ?? undefined, z.string().optional());
const optRecord = z.preprocess(
  (v) => v ?? undefined,
  z.record(z.string(), z.unknown()).optional()
);

const SessionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  status: z.enum(["active", "completed", "archived"]),
  workspaceId: optStr,
  projectId: optStr,
  metadata: optRecord,
  createdAt: DateValueSchema,
  updatedAt: DateValueSchema,
});

const MessageSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  role: z.enum(["user", "system", "assistant", "agent"]),
  content: z.string(),
  agentId: optStr,
  decompositionId: optStr,
  metadata: optRecord,
  createdAt: DateValueSchema,
});

const RuntimeTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  functionKey: z.enum([
    "contexts",
    "projects",
    "agents",
    "groups",
    "aggregation",
  ]),
  agentId: z.string(),
  agentName: z.string(),
  priority: z.number().int().nonnegative(),
  status: z.enum(["pending", "running", "done", "blocked"]),
  progress: z.number().min(0).max(100),
  notes: z.array(z.string()),
});

const RuntimeNoteSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  createdAt: z.number().int(),
  taskId: optStr,
});

const RuntimeSchema = z.object({
  sessionId: z.string(),
  runId: z.string().nullable(),
  language: z.enum(["pt-BR", "en-US", "es-ES"]),
  distributionReady: z.boolean(),
  isRunning: z.boolean(),
  tasks: z.array(RuntimeTaskSchema),
  notes: z.array(RuntimeNoteSchema),
  journeyCursor: z.number().int().nonnegative(),
  journeyVisited: z.array(
    z.enum(["contexts", "agents", "projects", "groups", "flows", "orchestra"])
  ),
  overallProgress: z.number().min(0).max(100),
  updatedAt: z.number().int(),
});

const AgentOutputSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  sessionId: z.string(),
  type: z.enum(["text", "code", "html", "image", "thought", "spawn"]),
  content: z.string(),
  metadata: optRecord,
  canvasNodeId: optStr,
  parentOutputId: optStr,
  createdAt: DateValueSchema,
});

const AgentSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  templateId: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.enum(["idle", "thinking", "working", "done", "error"]),
  provider: z.enum([
    "anthropic",
    "openai",
    "google",
    "groq",
    "fireworks",
    "mistral",
    "baseten",
    "perplexity",
    "together",
    "cohere",
  ]),
  model: z.string(),
  systemPrompt: z.string(),
  groupId: optStr,
  canvasNodeId: optStr,
  config: optRecord,
  outputs: z.array(AgentOutputSchema).max(50),
  createdAt: DateValueSchema,
  updatedAt: DateValueSchema,
});

const AgentGroupSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  name: z.string(),
  strategy: z.enum(["parallel", "sequential", "consensus"]),
  agentIds: z.array(z.string()),
  canvasNodeId: optStr,
  createdAt: DateValueSchema,
});

const PipelineSnapshotSchema = z.object({
  stage: z.enum([
    "idle",
    "intake",
    "decomposing",
    "routing",
    "spawning",
    "executing",
    "branching",
    "aggregating",
    "complete",
    "error",
  ]),
  progress: z.number().min(0).max(100),
  events: z.array(
    z.object({
      type: z.enum([
        "stage_change",
        "decomposition",
        "routing",
        "agent_spawned",
        "agent_status",
        "agent_output",
        "group_complete",
        "pipeline_complete",
        "error",
      ]),
      data: z.unknown(),
      timestamp: z.number(),
    })
  ),
  error: z.string().nullable(),
  startedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
});

const DecompositionSchema = z.object({
  id: z.string(),
  inputText: z.string(),
  tokens: z.array(
    z.object({
      token: z.string(),
      position: z.number(),
      weight: z.number(),
      role: z.enum([
        "subject",
        "action",
        "object",
        "modifier",
        "connector",
        "entity",
        "quantifier",
        "negation",
      ]),
      dependencies: z.array(z.number()),
      tags: z.array(z.string()),
    })
  ),
  intent: z.object({
    primary: z.enum([
      "create",
      "analyze",
      "transform",
      "question",
      "explore",
      "fix",
      "compare",
      "summarize",
      "design",
      "execute",
    ]),
    secondary: z.array(
      z.enum([
        "create",
        "analyze",
        "transform",
        "question",
        "explore",
        "fix",
        "compare",
        "summarize",
        "design",
        "execute",
      ])
    ),
    confidence: z.number(),
    actionVerbs: z.array(z.string()),
    targetNouns: z.array(z.string()),
  }),
  polarity: z.object({
    sentiment: z.number(),
    urgency: z.number(),
    certainty: z.number(),
    formality: z.number(),
    complexity: z.number(),
  }),
  context: z.object({
    domains: z.array(
      z.object({
        domain: z.string(),
        confidence: z.number(),
      })
    ),
    entities: z.array(
      z.object({
        name: z.string(),
        type: z.enum([
          "person",
          "place",
          "concept",
          "technology",
          "organization",
          "other",
        ]),
        relevance: z.number(),
      })
    ),
    implicitAssumptions: z.array(z.string()),
    requiredKnowledge: z.array(z.string()),
    outputFormat: z.enum(["code", "text", "html", "image", "data", "mixed"]),
  }),
  taskRouting: z.object({
    requiredAgents: z.array(
      z.object({
        templateId: z.string(),
        reason: z.string(),
        priority: z.number(),
        suggestedModel: z.string(),
        suggestedProvider: z.string(),
        inputContext: z.string(),
      })
    ),
    executionStrategy: z.enum(["parallel", "sequential", "pipeline", "consensus"]),
    estimatedComplexity: z.number(),
    suggestedGrouping: z.array(
      z.object({
        name: z.string(),
        agentIndices: z.array(z.number()),
      })
    ),
  }),
  timestamp: z.number(),
});

export const SessionSnapshotSchema = z.object({
  session: SessionSchema,
  messages: z.array(MessageSchema),
  runtime: RuntimeSchema,
  agents: z.array(AgentSchema),
  groups: z.array(AgentGroupSchema),
  decompositions: z.record(z.string(), DecompositionSchema),
  pipeline: PipelineSnapshotSchema,
});

export const SnapshotUpsertSchema = z.object({
  snapshot: SessionSnapshotSchema,
});

export const SessionCreateSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().min(1),
});

export type SessionSnapshotInput = z.infer<typeof SessionSnapshotSchema>;
export type SnapshotUpsertInput = z.infer<typeof SnapshotUpsertSchema>;
export type SessionCreateInput = z.infer<typeof SessionCreateSchema>;
