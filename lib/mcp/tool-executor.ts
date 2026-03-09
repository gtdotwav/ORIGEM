import { generateText } from "ai";
import { getLanguageModel } from "@/lib/server/ai/provider-factory";
import { ORIGEM_TOOLS } from "@/config/origem-tools";
import { getSpaceTools, executeTool } from "@/lib/mcp/connector-manager";
import { mcpToolsToAITools, parseMCPToolCall, isMCPToolCall } from "@/lib/mcp/tool-adapter";
import type { ProviderName } from "@/types/provider";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Tool Executor                                           */
/*  Enhanced generateText with real MCP tool execution loop            */
/* ------------------------------------------------------------------ */

interface ToolExecutionOptions {
  provider: ProviderName;
  model: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  systemPrompt?: string;
  maxOutputTokens: number;
  spaceId?: string;
  sessionId?: string;
  agentId?: string;
  maxToolRounds?: number;
}

interface ToolExecutionResult {
  content: string;
  provider: ProviderName;
  model: string;
  toolCallsExecuted: Array<{
    name: string;
    args: Record<string, unknown>;
    result: string;
    isMCP: boolean;
  }>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Execute a chat completion with full MCP tool execution loop.
 *
 * When the LLM requests a tool call:
 * - ORIGEM built-in tools: returned as-is (no execution)
 * - MCP tools: executed via the connector manager, result fed back to LLM
 *
 * The loop continues until the LLM responds without tool calls or maxToolRounds is reached.
 */
export async function executeWithTools(options: ToolExecutionOptions): Promise<ToolExecutionResult> {
  const {
    provider,
    model,
    messages,
    systemPrompt,
    maxOutputTokens,
    spaceId,
    sessionId,
    agentId,
    maxToolRounds = 5,
  } = options;

  const languageModel = await getLanguageModel(provider, model);

  // Build merged tool set: ORIGEM built-in + MCP tools for the Space
  let allTools: Record<string, unknown> = { ...ORIGEM_TOOLS };

  if (spaceId) {
    const spaceTools = await getSpaceTools(spaceId);
    for (const st of spaceTools) {
      const mcpTools = mcpToolsToAITools([st], st.connectorId, st.serverName);
      allTools = { ...allTools, ...mcpTools };
    }
  }

  const allMessages = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    ...messages,
  ];

  const toolCallsExecuted: ToolExecutionResult["toolCallsExecuted"] = [];
  let currentMessages = [...allMessages];
  let finalText = "";
  let finalUsage: ToolExecutionResult["usage"];

  for (let round = 0; round < maxToolRounds; round++) {
    const result = await generateText({
      model: languageModel,
      messages: currentMessages,
      tools: allTools as Parameters<typeof generateText>[0]["tools"],
      maxOutputTokens,
    });

    finalText = result.text;
    finalUsage = result.usage
      ? {
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        }
      : undefined;

    // No tool calls → done
    if (!result.toolCalls || result.toolCalls.length === 0) {
      break;
    }

    // Check if any are MCP tool calls
    const mcpCalls = result.toolCalls.filter((tc) => isMCPToolCall(tc.toolName));

    if (mcpCalls.length === 0) {
      // Only ORIGEM built-in tools — return as-is (no execution layer for those yet)
      break;
    }

    // Execute MCP tool calls
    const toolResults: Array<{ toolCallId: string; result: string }> = [];

    for (const tc of result.toolCalls) {
      if (!isMCPToolCall(tc.toolName)) {
        // Built-in tool — skip execution, provide a placeholder
        toolResults.push({
          toolCallId: tc.toolCallId,
          result: JSON.stringify({ note: "Built-in ORIGEM tool — processed internally" }),
        });
        toolCallsExecuted.push({
          name: tc.toolName,
          args: ((tc as Record<string, unknown>).args ?? (tc as Record<string, unknown>).input ?? {}) as Record<string, unknown>,
          result: "internal",
          isMCP: false,
        });
        continue;
      }

      const parsed = parseMCPToolCall(tc.toolName);
      if (!parsed) {
        toolResults.push({
          toolCallId: tc.toolCallId,
          result: JSON.stringify({ error: "Invalid MCP tool name format" }),
        });
        continue;
      }

      const mcpResult = await executeTool(
        parsed.connectorId,
        parsed.toolName,
        ((tc as Record<string, unknown>).args ?? (tc as Record<string, unknown>).input ?? {}) as Record<string, unknown>,
        { spaceId: spaceId ?? "", sessionId: sessionId ?? "", agentId },
      );

      const resultText = mcpResult.status === "success"
        ? (mcpResult.content?.map((c) => c.text ?? c.data ?? "").join("\n") ?? "OK")
        : `Error: ${mcpResult.error?.message ?? "Unknown error"}`;

      toolResults.push({
        toolCallId: tc.toolCallId,
        result: resultText,
      });

      toolCallsExecuted.push({
        name: parsed.toolName,
        args: ((tc as Record<string, unknown>).args ?? (tc as Record<string, unknown>).input ?? {}) as Record<string, unknown>,
        result: resultText.slice(0, 500),
        isMCP: true,
      });
    }

    // Build continuation messages with tool results
    currentMessages = [
      ...currentMessages,
      {
        role: "assistant" as const,
        content: result.text || `[Tool calls: ${result.toolCalls.map((tc) => tc.toolName).join(", ")}]`,
      },
      ...toolResults.map((tr) => ({
        role: "user" as const,
        content: `Tool result for ${tr.toolCallId}:\n${tr.result}`,
      })),
    ];
  }

  return {
    content: finalText,
    provider,
    model,
    toolCallsExecuted,
    usage: finalUsage,
  };
}
