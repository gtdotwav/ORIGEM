import { tool } from "ai";
import { z } from "zod";
import type { MCPToolSchema } from "@/types/mcp";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Tool Adapter                                            */
/*  Bridges MCP tool schemas ↔ Vercel AI SDK tool format               */
/* ------------------------------------------------------------------ */

/**
 * Convert a JSON Schema object to a Zod schema.
 * Handles common JSON Schema types used by MCP tools.
 */
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const type = schema.type as string | undefined;
  const description = schema.description as string | undefined;

  switch (type) {
    case "string": {
      let s = z.string();
      if (description) s = s.describe(description);
      if (schema.enum) return z.enum(schema.enum as [string, ...string[]]);
      return s;
    }
    case "number":
    case "integer": {
      let n = z.number();
      if (description) n = n.describe(description);
      return n;
    }
    case "boolean": {
      let b = z.boolean();
      if (description) b = b.describe(description);
      return b;
    }
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      const itemSchema = items ? jsonSchemaToZod(items) : z.unknown();
      let a = z.array(itemSchema);
      if (description) a = a.describe(description);
      return a;
    }
    case "object": {
      const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
      const required = (schema.required as string[]) ?? [];

      if (!properties || Object.keys(properties).length === 0) {
        return z.record(z.unknown());
      }

      const shape: Record<string, z.ZodTypeAny> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        const zodProp = jsonSchemaToZod(propSchema);
        shape[key] = required.includes(key) ? zodProp : zodProp.optional();
      }
      return z.object(shape);
    }
    default:
      return z.unknown();
  }
}

/**
 * Convert an MCP tool definition → Vercel AI SDK tool.
 * Prefixes tool name with connector ID for routing.
 */
export function mcpToolToAITool(
  mcpTool: MCPToolSchema,
  connectorId: string,
  serverName: string,
): { name: string; aiTool: any } {
  const prefixedName = `mcp__${connectorId}__${mcpTool.name}`;

  const inputSchema = mcpTool.inputSchema;
  const zodSchema = inputSchema && typeof inputSchema === "object" && Object.keys(inputSchema).length > 0
    ? jsonSchemaToZod(inputSchema)
    : z.object({});

  const aiTool = tool({
    description: `[${serverName}] ${mcpTool.description}`,
    inputSchema: zodSchema as z.ZodObject<Record<string, z.ZodTypeAny>>,
  });

  return { name: prefixedName, aiTool };
}

/**
 * Convert all MCP tools from a connector → Vercel AI SDK tools map.
 */
export function mcpToolsToAITools(
  tools: MCPToolSchema[],
  connectorId: string,
  serverName: string,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const t of tools) {
    const { name, aiTool } = mcpToolToAITool(t, connectorId, serverName);
    result[name] = aiTool;
  }

  return result;
}

/**
 * Parse a prefixed tool call name back to connector + tool name.
 * Format: mcp__{connectorId}__{toolName}
 */
export function parseMCPToolCall(prefixedName: string): { connectorId: string; toolName: string } | null {
  if (!prefixedName.startsWith("mcp__")) return null;

  const parts = prefixedName.slice(5).split("__");
  if (parts.length < 2) return null;

  const connectorId = parts[0];
  const toolName = parts.slice(1).join("__"); // tool name might contain __

  return { connectorId, toolName };
}

/**
 * Check if a tool call name is an MCP tool.
 */
export function isMCPToolCall(toolName: string): boolean {
  return toolName.startsWith("mcp__");
}
