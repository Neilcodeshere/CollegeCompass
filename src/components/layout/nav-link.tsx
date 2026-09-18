"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: string;
};

/**
 * Primary navigation item. The only client-side part of the header: it needs
 * the current pathname to mark the active section.
 */
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cx(
        "relative inline-flex h-11 items-center px-3 text-sm font-medium transition-colors sm:h-16",
        "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5",
        isActive
          ? "text-neutral-900 after:bg-brand-600"
          : "text-neutral-600 hover:text-neutral-900",
      )}
    >
      {children}
    </Link>
  );
}
