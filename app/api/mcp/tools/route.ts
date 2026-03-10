import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceTools } from "@/lib/mcp/connector-manager";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, parseSearchParams, toErrorResponse } from "@/lib/server/request";

const ToolsQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
});

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const query = parseSearchParams(request, ToolsQuerySchema);
    const workspaceId = query.workspaceId ?? query.spaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "missing_workspaceId" }, { status: 400 });
    }

    const tools = await getWorkspaceTools(workspaceId);
    return NextResponse.json({ tools });
  } catch (err) {
    if (err instanceof ApiRouteError) {
      return toErrorResponse(err, {
        code: "invalid_query",
        status: 400,
      });
    }

    const message = err instanceof Error ? err.message : "Failed to list tools";
    return NextResponse.json({ error: "list_failed", reason: message }, { status: 500 });
  }
}
