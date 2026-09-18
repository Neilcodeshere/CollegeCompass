import { handle, notFound, ok } from "@/lib/api/http";
import { getCollegeBySlug } from "@/lib/services/colleges";
import { collegeSlugSchema } from "@/lib/validation/shared";
import type { CollegeDetail, DataResponse } from "@/types/api";

/** GET /api/colleges/:slug */
export const GET = handle(
  async (_request: Request, context: RouteContext<"/api/colleges/[slug]">) => {
    const slug = collegeSlugSchema.parse((await context.params).slug);
    const college = await getCollegeBySlug(slug);
    if (!college) throw notFound("College not found.");
    return ok<DataResponse<CollegeDetail>>({ data: college }, { cacheable: true });
  },
);
