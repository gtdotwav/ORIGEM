import { NextResponse } from "next/server";
import { z } from "zod";
import { getMCPStore } from "@/lib/mcp/store";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, parseSearchParams, toErrorResponse } from "@/lib/server/request";

const AuditQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const query = parseSearchParams(request, AuditQuerySchema);
    const workspaceId = query.workspaceId ?? query.spaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "missing_workspaceId" }, { status: 400 });
    }

    const store = getMCPStore();
    const entries = await store.getAuditEntries(workspaceId, query.limit ?? 50);
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof ApiRouteError) {
      return toErrorResponse(err, {
        code: "invalid_query",
        status: 400,
      });
    }

    const message = err instanceof Error ? err.message : "Audit query failed";
    return NextResponse.json({ error: "audit_failed", reason: message }, { status: 500 });
  }
}
