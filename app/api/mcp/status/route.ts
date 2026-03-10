import { NextResponse } from "next/server";
import { z } from "zod";
import { getMCPStore } from "@/lib/mcp/store";
import { isConnected } from "@/lib/mcp/client";
import { requireApiSession } from "@/lib/server/api-auth";
import {
  ApiRouteError,
  parseSearchParams,
  toErrorResponse,
} from "@/lib/server/request";

const StatusQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
});

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const query = parseSearchParams(request, StatusQuerySchema);
    const workspaceId = query.workspaceId ?? query.spaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "missing_workspaceId" }, { status: 400 });
    }

    const store = getMCPStore();
    const connectors = await store.listConnectors(workspaceId);

    const status = connectors.map((c) => ({
      ...c,
      status: isConnected(c.id)
        ? ("connected" as const)
        : c.status === "connected"
          ? ("disconnected" as const)
          : c.status,
      env: undefined,
    }));

    return NextResponse.json({ connectors: status });
  } catch (err) {
    if (err instanceof ApiRouteError) {
      return toErrorResponse(err, {
        code: "invalid_query",
        status: 400,
      });
    }

    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: "status_failed", reason: message }, { status: 500 });
  }
}
