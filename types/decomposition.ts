export type TokenRole =
  | "subject"
  | "action"
  | "object"
  | "modifier"
  | "connector"
  | "entity"
  | "quantifier"
  | "negation";

export interface TokenAnalysis {
  token: string;
  position: number;
  weight: number;
  role: TokenRole;
  dependencies: number[];
  tags: string[];
}

export type Intent =
  | "create"
  | "analyze"
  | "transform"
  | "question"
  | "explore"
  | "fix"
  | "compare"
  | "summarize"
  | "design"
  | "execute";

export interface IntentClassification {
  primary: Intent;
  secondary: Intent[];
  confidence: number;
  actionVerbs: string[];
  targetNouns: string[];
}

export interface PolarityResult {
  sentiment: number;
  urgency: number;
  certainty: number;
  formality: number;
  complexity: number;
}

export interface DomainTag {
  domain: string;
  confidence: number;
}

export interface NamedEntity {
  name: string;
  type:
    | "person"
    | "place"
    | "concept"
    | "technology"
    | "organization"
    | "other";
  relevance: number;
}

export type OutputFormatHint =
  | "code"
  | "text"
  | "html"
  | "image"
  | "data"
  | "mixed";

export interface ContextExtraction {
  domains: DomainTag[];
  entities: NamedEntity[];
  implicitAssumptions: string[];
  requiredKnowledge: string[];
  outputFormat: OutputFormatHint;
}

export interface TaskRoutingResult {
  requiredAgents: AgentRequirement[];
  executionStrategy: "parallel" | "sequential" | "pipeline" | "consensus";
  estimatedComplexity: number;
  suggestedGrouping: { name: string; agentIndices: number[] }[];
}

export interface AgentRequirement {
  templateId: string;
  reason: string;
  priority: number;
  suggestedModel: string;
  suggestedProvider: string;
  inputContext: string;
}

export interface DecompositionResult {
  id: string;
  inputText: string;
  tokens: TokenAnalysis[];
  intent: IntentClassification;
  polarity: PolarityResult;
  context: ContextExtraction;
  taskRouting: TaskRoutingResult;
  timestamp: number;
}
