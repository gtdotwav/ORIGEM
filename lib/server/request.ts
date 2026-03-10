import { NextResponse } from "next/server";
import type { ZodType } from "zod";

const encoder = new TextEncoder();

export class ApiRouteError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly headers?: HeadersInit;

  constructor(
    code: string,
    options?: {
      status?: number;
      details?: unknown;
      headers?: HeadersInit;
      message?: string;
    }
  ) {
    super(options?.message ?? code);
    this.name = "ApiRouteError";
    this.code = code;
    this.status = options?.status ?? 400;
    this.details = options?.details;
    this.headers = options?.headers;
  }
}

export function jsonError(
  code: string,
  options?: {
    status?: number;
    details?: unknown;
    headers?: HeadersInit;
  }
) {
  return NextResponse.json(
    {
      error: code,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
    {
      status: options?.status ?? 400,
      headers: options?.headers,
    }
  );
}

export function toErrorResponse(
  error: unknown,
  fallback: {
    code: string;
    status: number;
    details?: unknown;
  }
) {
  if (error instanceof ApiRouteError) {
    return jsonError(error.code, {
      status: error.status,
      details: error.details,
      headers: error.headers,
    });
  }

  return jsonError(fallback.code, {
    status: fallback.status,
    details: fallback.details,
  });
}

export async function readJsonBody(
  request: Request,
  options?: {
    maxBytes?: number;
    emptyCode?: string;
  }
): Promise<unknown> {
  const maxBytes = options?.maxBytes;
  const contentLength = request.headers.get("content-length");

  if (maxBytes && contentLength) {
    const parsed = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      throw new ApiRouteError("payload_too_large", {
        status: 413,
        details: { maxBytes },
      });
    }
  }

  const rawBody = await request.text();
  const byteLength = encoder.encode(rawBody).length;

  if (maxBytes && byteLength > maxBytes) {
    throw new ApiRouteError("payload_too_large", {
      status: 413,
      details: { maxBytes },
    });
  }

  if (rawBody.trim().length === 0) {
    throw new ApiRouteError(options?.emptyCode ?? "empty_body", {
      status: 400,
    });
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new ApiRouteError("invalid_json", { status: 400 });
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  options?: {
    maxBytes?: number;
    emptyCode?: string;
  }
): Promise<T> {
  const body = await readJsonBody(request, options);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new ApiRouteError("invalid_body", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  return parsed.data;
}

export function parseSearchParams<T>(
  request: Request,
  schema: ZodType<T>
): T {
  const url = new URL(request.url);
  const rawEntries = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(rawEntries);

  if (!parsed.success) {
    throw new ApiRouteError("invalid_query", {
      status: 400,
      details: parsed.error.flatten(),
    });
  }

  return parsed.data;
}
