"use client";

import { useEffect } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Button, ButtonLink } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    // In production Next.js replaces server error messages with a digest, so
    // nothing sensitive reaches the browser. The digest links to server logs.
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Something went wrong</h1>
      <p className="mt-3 max-w-prose text-neutral-600">
        We couldn’t load this page. This is usually temporary, so please try again.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={retry}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go to homepage
        </ButtonLink>
      </div>
    </PageContainer>
  );
}
