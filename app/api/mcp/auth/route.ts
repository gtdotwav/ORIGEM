import { NextResponse } from "next/server";
import { getMCPStore } from "@/lib/mcp/store";
import { requireApiSession } from "@/lib/server/api-auth";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const body = await request.json() as {
      connectorId?: string;
      workspaceId?: string;
      spaceId?: string;
      serverId?: string;
      credentials?: Record<string, string>;
    };
    const workspaceId = body.workspaceId ?? body.spaceId;

    if (!body.connectorId || !workspaceId || !body.serverId || !body.credentials) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const store = getMCPStore();
    await store.setCredentials(body.connectorId, workspaceId, body.serverId, body.credentials);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to store credentials";
    return NextResponse.json(
      {
        error: message.includes("ORIGEM_ENCRYPT_SECRET")
          ? "storage_unavailable"
          : "auth_failed",
        reason: message,
      },
      { status: message.includes("ORIGEM_ENCRYPT_SECRET") ? 503 : 500 }
    );
  }
}
