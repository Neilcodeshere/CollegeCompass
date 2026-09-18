import { handle, ok, searchParamsOf } from "@/lib/api/http";
import { listColleges } from "@/lib/services/colleges";
import { collegeListQuerySchema } from "@/lib/validation/colleges";

/**
 * GET /api/colleges
 * ?search=&state=&ownership=&minFees=&maxFees=&minRating=&sort=&page=&limit=
 */
export const GET = handle(async (request: Request) => {
  const query = collegeListQuerySchema.parse(searchParamsOf(request));
  return ok(await listColleges(query), { cacheable: true });
});
