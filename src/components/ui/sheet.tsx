"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Bottom sheet built on the native `<dialog>` element, which handles focus
 * trapping, Escape to close and making the page behind it inert — no
 * dependency and no custom focus management.
 *
 * Being mounted means being open: the parent renders it to open it and stops
 * rendering it to close it. That keeps its form controls out of the document
 * while closed, and lets children start from fresh state on each open.
 */
export function Sheet({
  onClose,
  title,
  children,
  footer,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      // Fires for Escape as well as a programmatic close.
      onClose={onClose}
      // Clicks land on the dialog itself only when they hit the backdrop.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-lg bg-white p-0 text-neutral-900 shadow-overlay backdrop:bg-neutral-900/40 sm:m-auto sm:w-[32rem] sm:max-w-[calc(100%-2rem)] sm:rounded-lg"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 inline-flex size-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="flex gap-3 border-t border-neutral-200 px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
