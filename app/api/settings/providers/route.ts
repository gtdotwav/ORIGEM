import { NextResponse } from "next/server";
import {
  listProviderRecords,
  upsertProviderRecord,
} from "@/lib/server/backend/provider-service";
import { requireApiSession } from "@/lib/server/api-auth";
import { ApiRouteError, readJsonBody, toErrorResponse } from "@/lib/server/request";
import { PROVIDER_CATALOG } from "@/config/providers";
import { getProviderEnvApiKey } from "@/lib/server/ai/provider-factory";

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
    const records = await listProviderRecords();
    const recordsByProvider = new Map(records.map((record) => [record.provider, record]));

    return NextResponse.json({
      providers: PROVIDER_CATALOG.map((meta) => {
        const stored = recordsByProvider.get(meta.name);
        const envApiKey = stored ? null : getProviderEnvApiKey(meta.name);
        const apiKey = stored?.apiKey ?? envApiKey ?? "";

        return {
          provider: meta.name,
          selectedModel: stored?.selectedModel ?? meta.models[0]?.id ?? "",
          hasApiKey: apiKey.length > 0,
          keyHint: toHint(apiKey),
          updatedAt: stored?.updatedAt ?? 0,
          source: stored ? "stored" : envApiKey ? "env" : "none",
        };
      }),
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

    console.error("[providers] Storage error or internal failure:", error);
    const isCryptoError =
      error instanceof Error &&
      error.message.includes("ORIGEM_ENCRYPT_SECRET");

    return NextResponse.json(
      {
        error: isCryptoError ? "storage_unavailable" : "storage_error",
        details: error instanceof Error ? error.message : "unknown",
      },
      {
        status: isCryptoError ? 503 : 500,
      }
    );
  }
}
