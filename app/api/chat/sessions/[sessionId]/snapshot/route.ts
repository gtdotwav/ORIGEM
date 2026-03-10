import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  deleteSessionRecord,
  getSessionRecord,
  upsertSessionSnapshot,
} from "@/lib/server/backend/service";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, readJsonBody, toErrorResponse } from "@/lib/server/request";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const { sessionId } = await params;
  const record = await getSessionRecord(sessionId);

  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

const MAX_SNAPSHOT_BYTES = 10 * 1024 * 1024; // 10MB

export async function PUT(request: Request, { params }: Params) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const { sessionId } = await params;

  try {
    const body = await readJsonBody(request, { maxBytes: MAX_SNAPSHOT_BYTES });

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const snapshot = (body as { snapshot?: unknown }).snapshot;

    if (!snapshot || typeof snapshot !== "object") {
      return NextResponse.json({ error: "missing_snapshot" }, { status: 400 });
    }

    const snapshotSessionId =
      (snapshot as { session?: { id?: string } }).session?.id;

    if (snapshotSessionId && snapshotSessionId !== sessionId) {
      return NextResponse.json(
        {
          error: "session_id_mismatch",
          expected: sessionId,
          received: snapshotSessionId,
        },
        { status: 409 }
      );
    }

    const record = await upsertSessionSnapshot({ snapshot });
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_payload",
        status: 400,
      });
    }

    if (error instanceof ZodError) {
      const issues = error.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      }));
      console.error("[snapshot] Zod validation failed:", JSON.stringify(issues, null, 2));
      return NextResponse.json(
        { error: "invalid_snapshot", issues },
        { status: 400 }
      );
    }

    // Storage errors (e.g. read-only FS, blob failures) → 500
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[snapshot] Storage error:", message);
    return NextResponse.json(
      { error: "storage_error", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const { sessionId } = await params;
  await deleteSessionRecord(sessionId);

  return NextResponse.json({ ok: true });
}
