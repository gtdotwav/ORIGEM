import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authEnabled } from "@/lib/auth";
import { registerUser, RegistrationInputSchema } from "@/lib/server/auth/service";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/server/rate-limit";
import {
  ApiRouteError,
  parseJsonBody,
  toErrorResponse,
} from "@/lib/server/request";

export async function POST(request: Request) {
  if (!authEnabled) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "auth:register"),
    5,
    10 * 60_000
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: buildRateLimitHeaders(rateLimit),
      }
    );
  }

  try {
    const body = await parseJsonBody(request, RegistrationInputSchema, {
      maxBytes: 8_000,
    });
    const user = await registerUser(body);

    return NextResponse.json(
      { ok: true, user },
      {
        status: 201,
        headers: buildRateLimitHeaders(rateLimit),
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "email_already_in_use") {
        return NextResponse.json(
          { error: "email_already_in_use" },
          {
            status: 409,
            headers: buildRateLimitHeaders(rateLimit),
          }
        );
      }

      if (error.message === "registration_closed") {
        return NextResponse.json(
          { error: "registration_closed" },
          {
            status: 403,
            headers: buildRateLimitHeaders(rateLimit),
          }
        );
      }
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "invalid_body",
          details: error.flatten(),
        },
        {
          status: 400,
          headers: buildRateLimitHeaders(rateLimit),
        }
      );
    }

    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    console.error("[auth/register] failed:", error);
    return NextResponse.json(
      { error: "registration_failed" },
      {
        status: 500,
        headers: buildRateLimitHeaders(rateLimit),
      }
    );
  }
}
