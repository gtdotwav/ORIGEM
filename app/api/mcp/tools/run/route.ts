import { NextResponse } from "next/server";
import { z } from "zod";
import { executeTool } from "@/lib/mcp/connector-manager";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, parseJsonBody, toErrorResponse } from "@/lib/server/request";

const ToolRunBodySchema = z.object({
  connectorId: z.string().trim().min(1),
  toolName: z.string().trim().min(1),
  arguments: z.record(z.string(), z.unknown()).optional().default({}),
  workspaceId: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
  sessionId: z.string().trim().min(1).optional(),
  agentId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const body = await parseJsonBody(request, ToolRunBodySchema, {
      maxBytes: 128_000,
    });
    const workspaceId = body.workspaceId ?? body.spaceId;

    const result = await executeTool(
      body.connectorId,
      body.toolName,
      body.arguments ?? {},
      {
        workspaceId: workspaceId ?? "",
        sessionId: body.sessionId ?? "",
        agentId: body.agentId,
      },
    );

    const status = result.status === "success" ? 200 : result.status === "timeout" ? 504 : 422;
    return NextResponse.json(result, { status });
  } catch (err) {
    if (err instanceof ApiRouteError) {
      return toErrorResponse(err, {
        code: "invalid_body",
        status: 400,
      });
    }

    const message = err instanceof Error ? err.message : "Execution failed";
    return NextResponse.json({ error: "execution_failed", reason: message }, { status: 500 });
  }
}
