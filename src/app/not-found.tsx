import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found — CollegeCompass",
};

export default function NotFound() {
  return (
    <PageContainer className="py-16">
      <p className="text-sm font-medium text-neutral-600">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-3 max-w-prose text-neutral-600">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/colleges">Browse colleges</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Go to homepage
        </ButtonLink>
      </div>
    </PageContainer>
  );
}
