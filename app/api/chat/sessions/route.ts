import { NextResponse } from "next/server";
import {
  createSessionRecord,
  listSessionRecords,
} from "@/lib/server/backend/service";

export async function GET() {
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
  const body = await request.json().catch(() => null);
  try {
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
    return NextResponse.json(
      {
        error: "invalid_payload",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 400 }
    );
  }
}
