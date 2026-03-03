import { NextResponse } from "next/server";
import {
  deleteSessionRecord,
  getSessionRecord,
  upsertSessionSnapshot,
} from "@/lib/server/backend/service";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const { sessionId } = await params;
  const record = await getSessionRecord(sessionId);

  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PUT(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => null);

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

  try {
    const record = await upsertSessionSnapshot({ snapshot });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_snapshot",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { sessionId } = await params;
  await deleteSessionRecord(sessionId);

  return NextResponse.json({ ok: true });
}
