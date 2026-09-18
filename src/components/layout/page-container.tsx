import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Constrains content to the page width with responsive side gutters. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cx("mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
