import { NextResponse } from "next/server";
import { z } from "zod";
import { installConnector } from "@/lib/mcp/connector-manager";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, parseJsonBody, toErrorResponse } from "@/lib/server/request";

const ConnectBodySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
  serverId: z.string().trim().min(1),
  credentials: z.record(z.string(), z.string()).optional().default({}),
});

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const body = await parseJsonBody(request, ConnectBodySchema, {
      maxBytes: 64_000,
    });
    const workspaceId = body.workspaceId ?? body.spaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "missing_fields", details: "workspaceId required" },
        { status: 400 },
      );
    }

    const connector = await installConnector(
      workspaceId,
      body.serverId,
      body.credentials ?? {},
    );

    return NextResponse.json({ ok: true, connector }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiRouteError) {
      return toErrorResponse(err, {
        code: "invalid_body",
        status: 400,
      });
    }

    const message = err instanceof Error ? err.message : "Failed to connect";
    return NextResponse.json(
      {
        error: message.includes("ORIGEM_ENCRYPT_SECRET")
          ? "storage_unavailable"
          : "connection_failed",
        reason: message,
      },
      { status: message.includes("ORIGEM_ENCRYPT_SECRET") ? 503 : 422 }
    );
  }
}
