import { tool } from "ai";
import { z } from "zod";

/**
 * ORIGEM psychosemantic function tools.
 * Passed to the LLM so it can invoke structured capabilities.
 */
export const ORIGEM_TOOLS = {
  semantic_decompose: tool({
    description:
      "Break a concept into atomic semantic units and meaning layers",
    inputSchema: z.object({
      concept: z.string().describe("Concept or idea to decompose"),
    }),
  }),
  semantic_analysis: tool({
    description:
      "Analyze the deeper meaning, intent, assumptions and implications of text",
    inputSchema: z.object({
      text: z.string(),
    }),
  }),
  semantic_graph: tool({
    description: "Create a semantic relationship graph between concepts",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
  context_map: tool({
    description:
      "Create a contextual map connecting entities, ideas, systems and outcomes",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
  expand_context: tool({
    description:
      "Expand a concept with additional relevant context and knowledge",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
  generate_ideas: tool({
    description: "Generate innovative ideas based on a topic",
    inputSchema: z.object({
      topic: z.string(),
      quantity: z.number().optional(),
    }),
  }),
  deep_research: tool({
    description: "Perform deep research on a topic",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
  spawn_agents: tool({
    description: "Spawn specialized reasoning agents to solve a task",
    inputSchema: z.object({
      task: z.string(),
      agents: z.array(z.string()).optional(),
    }),
  }),
  orchestrate_agents: tool({
    description:
      "Coordinate multiple agents working on the same problem",
    inputSchema: z.object({
      task: z.string(),
    }),
  }),
  agent_perspectives: tool({
    description: "Generate multiple expert perspectives about a topic",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
  workflow_create: tool({
    description: "Create an AI workflow composed of multiple steps",
    inputSchema: z.object({
      goal: z.string(),
    }),
  }),
  knowledge_expand: tool({
    description:
      "Expand a topic using knowledge graphs and contextual relations",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
  knowledge_store: tool({
    description: "Store information into the knowledge system",
    inputSchema: z.object({
      content: z.string(),
    }),
  }),
  knowledge_retrieve: tool({
    description: "Retrieve stored knowledge related to a query",
    inputSchema: z.object({
      query: z.string(),
    }),
  }),
  multimodal_analysis: tool({
    description: "Analyze images, audio or multimodal content",
    inputSchema: z.object({
      input: z.string(),
    }),
  }),
  generate_image: tool({
    description: "Generate an image from a prompt",
    inputSchema: z.object({
      prompt: z.string(),
    }),
  }),
  code_generate: tool({
    description: "Generate code for software development tasks",
    inputSchema: z.object({
      task: z.string(),
      language: z.string().optional(),
    }),
  }),
  code_analyze: tool({
    description: "Analyze and explain source code",
    inputSchema: z.object({
      code: z.string(),
    }),
  }),
  system_reasoning: tool({
    description: "Perform deep reasoning about complex systems",
    inputSchema: z.object({
      system: z.string(),
    }),
  }),
  decision_analysis: tool({
    description: "Analyze decisions and possible outcomes",
    inputSchema: z.object({
      decision: z.string(),
    }),
  }),
  future_scenarios: tool({
    description: "Generate possible future scenarios based on trends",
    inputSchema: z.object({
      topic: z.string(),
    }),
  }),
};
