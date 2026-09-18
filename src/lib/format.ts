/**
 * Display formatters. All numbers use Indian digit grouping (1,25,000), which
 * is what students reading fees and ranks expect.
 */

const RUPEES_PER_LAKH = 100_000;
const RUPEES_PER_CRORE = 10_000_000;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const lakhFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

// Crore figures carry two decimals, so ₹1.68 Cr doesn't round to ₹1.7 Cr.
const croreFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 125000 → "₹1,25,000" */
export function formatCurrency(rupees: number): string {
  return currencyFormatter.format(rupees);
}

/**
 * Annual salary package in rupees → "₹9.6 LPA" (lakhs per annum), switching to
 * crore past a hundred lakh, the way Indian salary figures are actually
 * quoted: "₹1.68 Cr", never "₹168 LPA".
 */
export function formatPackage(rupees: number): string {
  if (rupees >= RUPEES_PER_CRORE) {
    return `₹${croreFormatter.format(rupees / RUPEES_PER_CRORE)} Cr`;
  }
  return `₹${lakhFormatter.format(rupees / RUPEES_PER_LAKH)} LPA`;
}

/** 124500 → "1,24,500" */
export function formatRank(rank: number): string {
  return integerFormatter.format(rank);
}

/** Ratings always show one decimal so a column of ratings lines up: 4 → "4.0". */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Share from 0–1 → "87%". */
export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** ISO date → "March 2025". Reviews only need the month. */
export function formatReviewDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
