import { handle, ok, readJson } from "@/lib/api/http";
import { predictColleges } from "@/lib/services/predictor";
import { predictRequestSchema } from "@/lib/validation/predictor";
import type { DataResponse, PredictionResult } from "@/types/api";

/** POST /api/predict  { exam, rank, category? } */
export const POST = handle(async (request: Request) => {
  const input = predictRequestSchema.parse(await readJson(request));
  return ok<DataResponse<PredictionResult>>({ data: await predictColleges(input) });
});
