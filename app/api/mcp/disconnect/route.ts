import { NextResponse } from "next/server";
import { z } from "zod";
import { uninstallConnector } from "@/lib/mcp/connector-manager";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, parseJsonBody, toErrorResponse } from "@/lib/server/request";

const DisconnectBodySchema = z.object({
  connectorId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const body = await parseJsonBody(request, DisconnectBodySchema, {
      maxBytes: 8_000,
    });
    await uninstallConnector(body.connectorId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiRouteError) {
      return toErrorResponse(err, {
        code: "invalid_body",
        status: 400,
      });
    }

    const message = err instanceof Error ? err.message : "Failed to disconnect";
    return NextResponse.json({ error: "disconnect_failed", reason: message }, { status: 500 });
  }
}
