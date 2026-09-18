"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner, ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompareSelection } from "@/hooks/use-compare-selection";
import { fetchComparison } from "@/lib/api/client";
import { MAX_COMPARE_COLLEGES } from "@/lib/colleges/constants";
import type { CompareItem } from "@/lib/compare/selection";
import type { ComparisonResult } from "@/types/api";

import { AddCollegeDialog } from "./add-college-dialog";
import { ComparisonTable } from "./comparison-table";

function parseSlugs(raw: string | null): string[] {
  if (!raw) return [];
  const slugs = raw
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  return [...new Set(slugs)].slice(0, MAX_COMPARE_COLLEGES);
}

/**
 * On this page the URL is the source of truth, so a shared link shows exactly
 * the colleges it names. The tray selection is set to match on arrival, which
 * means opening someone else's link adopts their colleges as your selection.
 */
export function ComparisonView({
  initialSlugs,
  initialData,
}: {
  initialSlugs: string[];
  initialData: ComparisonResult;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slugs = parseSlugs(searchParams.get("slugs"));
  const {
    items,
    replace,
    remove: removeFromSelection,
    add: addToSelection,
  } = useCompareSelection();
  const [isAddOpen, setAddOpen] = useState(false);

  const isInitialQuery = slugs.join(",") === initialSlugs.join(",");
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ["comparison", slugs.join(",")],
    queryFn: ({ signal }) => fetchComparison(slugs, signal).then((response) => response.data),
    enabled: slugs.length > 0,
    ...(isInitialQuery && slugs.length > 0 && { initialData }),
  });

  // Adopt the link's colleges as the current selection, once per URL.
  const adoptedRef = useRef<string | null>(null);
  useEffect(() => {
    const key = slugs.join(",");
    if (adoptedRef.current === key) return;
    adoptedRef.current = key;
    if (!data) return;
    replace(
      data.colleges.map((college) => ({
        slug: college.slug,
        name: college.name,
        shortName: college.shortName,
        city: college.city,
      })),
    );
  }, [slugs, data, replace]);

  const setSlugs = (next: string[]) => {
    const search = next.length > 0 ? `?slugs=${next.join(",")}` : "";
    window.history.pushState(null, "", `${pathname}${search}`);
  };

  const handleRemove = (slug: string) => {
    removeFromSelection(slug);
    setSlugs(slugs.filter((current) => current !== slug));
  };

  const handleAdd = (college: CompareItem) => {
    addToSelection(college);
    setSlugs([...slugs, college.slug].slice(0, MAX_COMPARE_COLLEGES));
  };

  const colleges = data?.colleges ?? [];
  const canAddMore = colleges.length < MAX_COMPARE_COLLEGES;

  const addButton = canAddMore ? (
    <Button variant="secondary" onClick={() => setAddOpen(true)}>
      <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
      Add a college
    </Button>
  ) : null;

  const body = () => {
    if (slugs.length === 0) {
      return (
        <EmptyState
          title="You haven’t selected any colleges yet"
          description="Pick up to three colleges from the list and they’ll appear here side by side."
          action={<ButtonLink href="/colleges">Explore colleges</ButtonLink>}
        />
      );
    }
    if (isError && !data) {
      return (
        <ErrorState
          title="Unable to load the comparison"
          description="We couldn't load these colleges just now. Please try again."
          onRetry={() => void refetch()}
        />
      );
    }
    if (!data) {
      return (
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }
    if (colleges.length === 0) {
      return (
        <EmptyState
          title="These colleges couldn’t be found"
          description="The colleges in this link are no longer available."
          action={<ButtonLink href="/colleges">Explore colleges</ButtonLink>}
        />
      );
    }
    return (
      <>
        <ComparisonTable colleges={colleges} onRemove={handleRemove} />
        {colleges.length === 1 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center">
            <p className="text-sm font-medium text-neutral-900">Add a second college to compare</p>
            <p className="mt-1 text-sm text-neutral-600">
              A comparison needs at least two colleges side by side.
            </p>
            {addButton ? <div className="mt-4 flex justify-center">{addButton}</div> : null}
          </div>
        ) : null}
      </>
    );
  };

  return (
    <PageContainer className="py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Compare colleges</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {items.length > 0
              ? `Comparing ${colleges.length} of up to ${MAX_COMPARE_COLLEGES} colleges.`
              : `Compare up to ${MAX_COMPARE_COLLEGES} colleges side by side.`}
            {isFetching ? <span className="ml-2 text-neutral-500">Updating…</span> : null}
          </p>
        </div>
        {colleges.length >= 2 ? addButton : null}
      </header>

      <div className="mt-6 space-y-4">
        {isError && data ? (
          <ErrorBanner
            description="Couldn't refresh the comparison, so these figures may be out of date."
            onRetry={() => void refetch()}
          />
        ) : null}

        {data && data.missing.length > 0 ? (
          <p className="rounded-md border border-warning-600/30 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            {data.missing.length === 1
              ? "One college in this link couldn’t be found and was left out."
              : `${data.missing.length} colleges in this link couldn’t be found and were left out.`}
          </p>
        ) : null}

        {body()}

        {colleges.length > 0 ? (
          <p className="text-xs text-neutral-500">
            Packages and placement figures are from the most recent reported year. All figures are
            sample data.
          </p>
        ) : null}
      </div>

      {isAddOpen ? (
        <AddCollegeDialog
          selectedSlugs={slugs}
          onAdd={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </PageContainer>
  );
}
