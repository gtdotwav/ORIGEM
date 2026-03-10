import { NextResponse } from "next/server";
import {
  listProviderRecords,
  upsertProviderRecord,
} from "@/lib/server/backend/provider-service";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, readJsonBody, toErrorResponse } from "@/lib/server/request";

function toHint(apiKey: string) {
  const tail = apiKey.slice(-4);
  if (!tail) {
    return null;
  }
  return `••••${tail}`;
}

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const providers = await listProviderRecords();

    return NextResponse.json({
      providers: providers.map((provider) => ({
        provider: provider.provider,
        selectedModel: provider.selectedModel,
        hasApiKey: provider.apiKey.length > 0,
        keyHint: toHint(provider.apiKey),
        updatedAt: provider.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[providers] Failed to load providers:", error);
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  try {
    const body = await readJsonBody(request, { maxBytes: 16_000 });
    const record = await upsertProviderRecord(body);
    return NextResponse.json({
      ok: true,
      provider: {
        provider: record.provider,
        selectedModel: record.selectedModel,
        hasApiKey: record.apiKey.length > 0,
        keyHint: toHint(record.apiKey),
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    console.error("[providers] Invalid payload:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          error.message.includes("ORIGEM_ENCRYPT_SECRET")
            ? "storage_unavailable"
            : "invalid_payload",
      },
      {
        status:
          error instanceof Error &&
          error.message.includes("ORIGEM_ENCRYPT_SECRET")
            ? 503
            : 400,
      }
    );
  }
}
