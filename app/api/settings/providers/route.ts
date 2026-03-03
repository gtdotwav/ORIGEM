import { NextResponse } from "next/server";
import {
  listProviderRecords,
  upsertProviderRecord,
} from "@/lib/server/backend/provider-service";

function toHint(apiKey: string) {
  const tail = apiKey.slice(-4);
  if (!tail) {
    return null;
  }
  return `••••${tail}`;
}

export async function GET() {
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
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);

  try {
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
    return NextResponse.json(
      {
        error: "invalid_payload",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 400 }
    );
  }
}
