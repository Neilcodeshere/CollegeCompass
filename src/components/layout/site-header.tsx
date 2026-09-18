import Link from "next/link";

import { NavLink } from "./nav-link";
import { PageContainer } from "./page-container";

const NAV_ITEMS = [
  { href: "/colleges", label: "Colleges" },
  { href: "/compare", label: "Compare" },
  { href: "/predictor", label: "Predictor" },
] as const;

/**
 * With only three destinations, navigation stays visible on every screen size
 * instead of hiding behind a menu button: on small screens the links move to a
 * second row below the wordmark.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <PageContainer className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex h-12 items-center self-start text-lg font-semibold text-neutral-900 sm:h-16"
        >
          CollegeCompass
        </Link>
        <nav aria-label="Primary" className="-mx-3">
          <ul className="flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </PageContainer>
    </header>
  );
}
