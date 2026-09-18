import "server-only";

import * as z from "zod/mini";

import type { ApiErrorCode, ApiErrorResponse } from "@/types/api";

/**
 * College data only changes when the database is reseeded, so shared caches
 * (Vercel's CDN) may serve GET responses for a minute and refresh them in the
 * background for five more.
 */
const CACHEABLE = "public, s-maxage=60, stale-while-revalidate=300";

/** An expected failure with a message that is safe to show to users. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string) => new ApiError(400, "VALIDATION_ERROR", message);
export const notFound = (message: string) => new ApiError(404, "NOT_FOUND", message);

/**
 * JSON bodies this API accepts are tiny (a prediction request is under 100
 * bytes). Capping them stops a client from making the server read and parse
 * megabytes of data per request.
 */
export const MAX_JSON_BODY_BYTES = 10_000;

const payloadTooLarge = () =>
  new ApiError(413, "PAYLOAD_TOO_LARGE", "The request body is too large.");

export function ok<T>(body: T, { cacheable = false }: { cacheable?: boolean } = {}): Response {
  return Response.json(body, {
    status: 200,
    headers: { "Cache-Control": cacheable ? CACHEABLE : "no-store" },
  });
}

function errorResponse(status: number, error: ApiErrorResponse["error"]): Response {
  return Response.json({ error } satisfies ApiErrorResponse, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Maps any thrown value to the error envelope. Unexpected errors are logged
 * server-side and reported with a generic message, so stack traces and
 * database details never reach the client.
 */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof z.core.$ZodError) {
    const { formErrors, fieldErrors } = z.flattenError(error);
    const cleanFieldErrors = Object.fromEntries(
      Object.entries(fieldErrors as Record<string, string[] | undefined>).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0,
      ),
    );
    return errorResponse(400, {
      code: "VALIDATION_ERROR",
      message: formErrors[0] ?? "Some of the values provided are invalid.",
      ...(Object.keys(cleanFieldErrors).length > 0 && { fieldErrors: cleanFieldErrors }),
    });
  }

  if (error instanceof ApiError) {
    return errorResponse(error.status, { code: error.code, message: error.message });
  }

  console.error("Unhandled API error:", error);
  return errorResponse(500, {
    code: "INTERNAL_ERROR",
    message: "Something went wrong on our side. Please try again.",
  });
}

/** Wraps a route handler so every thrown error becomes a consistent JSON response. */
export function handle<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function searchParamsOf(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

/**
 * Reads the body as a stream and stops as soon as it passes the limit, so an
 * oversized request is rejected without being held in memory. The
 * Content-Length header is checked first as a fast path, but not trusted: it
 * can be missing (chunked uploads) or simply wrong.
 */
async function readBodyText(request: Request, limit: number): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > limit) throw payloadTooLarge();
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) {
      await reader.cancel();
      throw payloadTooLarge();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function readJson(request: Request): Promise<unknown> {
  const text = await readBodyText(request, MAX_JSON_BODY_BYTES);
  try {
    return JSON.parse(text);
  } catch {
    throw badRequest("The request body must be valid JSON.");
  }
}
