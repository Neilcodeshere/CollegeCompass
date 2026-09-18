import { Skeleton } from "@/components/ui/skeleton";
import type { CollegeSummary } from "@/types/api";

import { CollegeResultItem } from "./college-result-item";

export function CollegeResults({ colleges }: { colleges: CollegeSummary[] }) {
  return (
    <ul className="divide-y divide-neutral-200">
      {colleges.map((college) => (
        <li key={college.id}>
          <CollegeResultItem college={college} />
        </li>
      ))}
    </ul>
  );
}

/** Matches the row layout so nothing shifts when the real results arrive. */
export function CollegeResultsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-neutral-200">
      {Array.from({ length: rows }, (_, index) => (
        <li
          key={index}
          className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-5"
        >
          <div className="min-w-0">
            <Skeleton className="h-5 w-64 max-w-full" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          <div className="grid grid-cols-3 gap-4 sm:w-80 sm:gap-6">
            {Array.from({ length: 3 }, (_, statIndex) => (
              <div key={statIndex}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-1.5 h-4 w-20" />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
