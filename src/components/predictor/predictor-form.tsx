"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EXAM_LABELS, EXAMS } from "@/lib/exams";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/predictor/constants";
import {
  predictorFormSchema,
  toFieldErrors,
  type PredictorFieldErrors,
  type PredictorFormValues,
} from "@/lib/validation/predictor";

export type PredictorFormDraft = { exam: string; rank: string; category: string };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger-700">
      {message}
    </p>
  );
}

/**
 * Validates with the same schema the API uses, so the messages a student sees
 * here are the messages the server would give. The server still validates:
 * this is a convenience, not the guard.
 */
export function PredictorForm({
  initialValues,
  onSubmit,
}: {
  initialValues: PredictorFormDraft;
  onSubmit: (values: PredictorFormValues) => void;
}) {
  const [draft, setDraft] = useState(initialValues);
  const [errors, setErrors] = useState<PredictorFieldErrors>({});

  const update = (field: keyof PredictorFormDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    // Clear this field's error as soon as it is edited.
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = predictorFormSchema.safeParse(draft);
    if (!result.success) {
      setErrors(toFieldErrors(result.error));
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
        <div>
          <label htmlFor="exam" className="block text-sm font-medium text-neutral-900">
            Entrance exam
          </label>
          <Select
            id="exam"
            value={draft.exam}
            onChange={(event) => update("exam", event.target.value)}
            aria-invalid={Boolean(errors.exam)}
            aria-describedby={errors.exam ? "exam-error" : undefined}
            className="mt-1.5 h-11"
          >
            <option value="">Select an exam</option>
            {EXAMS.map((exam) => (
              <option key={exam} value={exam}>
                {EXAM_LABELS[exam]}
              </option>
            ))}
          </Select>
          <FieldError id="exam-error" message={errors.exam} />
        </div>

        <div>
          <label htmlFor="rank" className="block text-sm font-medium text-neutral-900">
            Your rank
          </label>
          <Input
            id="rank"
            value={draft.rank}
            onChange={(event) => update("rank", event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 12450"
            aria-invalid={Boolean(errors.rank)}
            aria-describedby={errors.rank ? "rank-error" : "rank-hint"}
            className="mt-1.5 h-11"
          />
          <FieldError id="rank-error" message={errors.rank} />
          {!errors.rank ? (
            <p id="rank-hint" className="mt-1.5 text-xs text-neutral-500">
              Use your overall merit-list rank.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-900">
            Category
          </label>
          <Select
            id="category"
            value={draft.category}
            onChange={(event) => update("category", event.target.value)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
            className="mt-1.5 h-11"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
          <FieldError id="category-error" message={errors.category} />
        </div>

        <Button type="submit" size="lg" className="mt-1.5 w-full sm:w-auto">
          <Search aria-hidden="true" className="size-4" strokeWidth={2} />
          Find colleges
        </Button>
      </div>
    </form>
  );
}
