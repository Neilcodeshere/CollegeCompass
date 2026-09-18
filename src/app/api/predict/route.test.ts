import { afterEach, describe, expect, it, vi } from "vitest";

import { predictColleges } from "@/lib/services/predictor";
import type { PredictionResult } from "@/types/api";

import { POST } from "./route";

vi.mock("@/lib/services/predictor", () => ({ predictColleges: vi.fn() }));

const predictMock = vi.mocked(predictColleges);

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const emptyResult: PredictionResult = {
  exam: "MHT_CET",
  category: "GENERAL",
  rank: 12_450,
  basisYear: 2025,
  results: [],
  counts: { LIKELY: 0, BORDERLINE: 0, REACH: 0 },
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/predict", () => {
  it("defaults the category to General and returns the prediction", async () => {
    predictMock.mockResolvedValue(emptyResult);

    const response = await post({ exam: "MHT_CET", rank: 12_450 });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: emptyResult });
    expect(predictMock).toHaveBeenCalledWith({
      exam: "MHT_CET",
      rank: 12_450,
      category: "GENERAL",
    });
  });

  it("forwards an explicit category", async () => {
    predictMock.mockResolvedValue({ ...emptyResult, category: "OBC" });

    await post({ exam: "JEE_MAIN", rank: 1, category: "OBC" });

    expect(predictMock).toHaveBeenCalledWith({ exam: "JEE_MAIN", rank: 1, category: "OBC" });
  });

  it("rejects a body that isn't JSON", async () => {
    const response = await post("exam=MHT_CET&rank=5");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "VALIDATION_ERROR", message: "The request body must be valid JSON." },
    });
  });

  it.each([
    [{ rank: 100 }, "exam", "Choose an entrance exam."],
    [{ exam: "NEET", rank: 100 }, "exam", "Choose an entrance exam."],
    [{ exam: "KCET" }, "rank", "Enter your rank as a number."],
    [{ exam: "KCET", rank: "12450" }, "rank", "Enter your rank as a number."],
    [{ exam: "KCET", rank: 0 }, "rank", "Rank must be greater than 0."],
    [{ exam: "KCET", rank: -20 }, "rank", "Rank must be greater than 0."],
    [{ exam: "KCET", rank: 12.5 }, "rank", "Rank must be a whole number."],
    [{ exam: "KCET", rank: 300_001 }, "rank", "KCET ranks go up to 3,00,000."],
    [{ exam: "KCET", rank: 10, category: "NRI" }, "category", "Choose a valid category."],
  ])("rejects %j", async (body, field, message) => {
    const response = await post(body);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fieldErrors[field]).toEqual([message]);
    expect(predictMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized body with 413 before parsing it", async () => {
    const response = await post({ exam: "KCET", rank: 5, padding: "x".repeat(20_000) });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: { code: "PAYLOAD_TOO_LARGE", message: "The request body is too large." },
    });
    expect(predictMock).not.toHaveBeenCalled();
  });

  it("enforces the limit even when Content-Length is missing or understated", async () => {
    // A streamed body with no Content-Length header must still be cut off.
    const oversized = new TextEncoder().encode(
      JSON.stringify({ exam: "KCET", rank: 5, padding: "x".repeat(20_000) }),
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < oversized.length; i += 1_000) {
          controller.enqueue(oversized.slice(i, i + 1_000));
        }
        controller.close();
      },
    });

    const response = await POST(
      new Request("http://localhost/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": "50" },
        body: stream,
        duplex: "half",
      } as RequestInit),
    );

    expect(response.status).toBe(413);
    expect(predictMock).not.toHaveBeenCalled();
  });

  it("treats an empty body as invalid JSON", async () => {
    const response = await POST(new Request("http://localhost/api/predict", { method: "POST" }));
    expect(response.status).toBe(400);
  });

  it("accepts the largest valid rank for an exam", async () => {
    predictMock.mockResolvedValue(emptyResult);

    const response = await post({ exam: "KCET", rank: 300_000 });

    expect(response.status).toBe(200);
  });
});
