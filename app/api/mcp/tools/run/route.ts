import { NextResponse } from "next/server";
import { executeTool } from "@/lib/mcp/connector-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      connectorId?: string;
      toolName?: string;
      arguments?: Record<string, unknown>;
      spaceId?: string;
      sessionId?: string;
      agentId?: string;
    };

    if (!body.connectorId || !body.toolName) {
      return NextResponse.json(
        { error: "missing_fields", details: "connectorId and toolName required" },
        { status: 400 },
      );
    }

    const result = await executeTool(
      body.connectorId,
      body.toolName,
      body.arguments ?? {},
      {
        spaceId: body.spaceId ?? "",
        sessionId: body.sessionId ?? "",
        agentId: body.agentId,
      },
    );

    const status = result.status === "success" ? 200 : result.status === "timeout" ? 504 : 422;
    return NextResponse.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution failed";
    return NextResponse.json({ error: "execution_failed", reason: message }, { status: 500 });
  }
}
