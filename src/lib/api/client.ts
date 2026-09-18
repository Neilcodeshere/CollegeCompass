/**
 * Browser-side API client. Every request goes through `request()` so error
 * handling, abort signals and typing are identical everywhere.
 */
import { serializeCollegeFilters } from "@/lib/filters/college-filters";
import type { CollegeListQuery } from "@/lib/validation/colleges";
import type { PredictRequest } from "@/lib/validation/predictor";
import type {
  ApiErrorResponse,
  CollegeSummary,
  ComparisonResult,
  DataResponse,
  PaginatedResponse,
  PredictionResult,
} from "@/types/api";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  /** 4xx responses won't succeed on retry; 5xx and network errors might. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    // Aborted requests are expected when a newer one supersedes this one.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiRequestError(0, "We couldn't reach the server. Check your connection.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as ApiErrorResponse | null)?.error;
    throw new ApiRequestError(
      response.status,
      error?.message ?? "Something went wrong. Please try again.",
      error?.fieldErrors,
    );
  }

  return body as T;
}

export function collegesApiPath(query: CollegeListQuery): string {
  const search = serializeCollegeFilters(query);
  return search ? `/api/colleges?${search}` : "/api/colleges";
}

export function fetchColleges(
  query: CollegeListQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<CollegeSummary>> {
  return request(collegesApiPath(query), { signal });
}

export function fetchComparison(
  slugs: string[],
  signal?: AbortSignal,
): Promise<DataResponse<ComparisonResult>> {
  return request(`/api/colleges/compare?slugs=${slugs.map(encodeURIComponent).join(",")}`, {
    signal,
  });
}

export function predictColleges(
  input: PredictRequest,
  signal?: AbortSignal,
): Promise<DataResponse<PredictionResult>> {
  return request("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}
