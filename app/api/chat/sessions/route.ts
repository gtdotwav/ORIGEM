import { NextResponse } from "next/server";
import {
  createSessionRecord,
  listSessionRecords,
} from "@/lib/server/backend/service";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, readJsonBody, toErrorResponse } from "@/lib/server/request";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const records = await listSessionRecords();

  return NextResponse.json({
    sessions: records.map((record) => ({
      id: record.snapshot.session.id,
      title: record.snapshot.session.title,
      status: record.snapshot.session.status,
      metadata: record.snapshot.session.metadata,
      createdAt: record.snapshot.session.createdAt,
      updatedAtRaw: record.snapshot.session.updatedAt,
      updatedAt: record.updatedAt,
      version: record.version,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }
  try {
    const body = await readJsonBody(request, { maxBytes: 8_000 });
    const record = await createSessionRecord(body);
    return NextResponse.json(
      {
        ok: true,
        session: {
          id: record.snapshot.session.id,
          title: record.snapshot.session.title,
          status: record.snapshot.session.status,
          updatedAt: record.updatedAt,
          version: record.version,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_payload",
        status: 400,
      });
    }

    return NextResponse.json(
      {
        error: "invalid_payload",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 400 }
    );
  }
}
