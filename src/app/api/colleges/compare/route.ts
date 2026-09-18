import { handle, ok, searchParamsOf } from "@/lib/api/http";
import { getCollegesForComparison } from "@/lib/services/colleges";
import { compareQuerySchema } from "@/lib/validation/colleges";
import type { ComparisonResult, DataResponse } from "@/types/api";

/**
 * GET /api/colleges/compare?slugs=a,b,c
 *
 * Unknown slugs are reported in `missing` instead of failing the request, so a
 * shared link with one outdated college still shows the others.
 */
export const GET = handle(async (request: Request) => {
  const { slugs } = compareQuerySchema.parse(searchParamsOf(request));
  const result = await getCollegesForComparison(slugs);
  return ok<DataResponse<ComparisonResult>>({ data: result }, { cacheable: true });
});
