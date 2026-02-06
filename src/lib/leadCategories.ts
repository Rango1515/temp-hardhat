// Static label map used as fallback for known categories
const KNOWN_LABELS: Record<string, string> = {
  electricians: "Electricians",
  general_contractors: "General Contractors",
  roofing: "Roofing Companies",
  hvac: "HVAC",
  plumbing: "Plumbing",
  coffee_shops: "Coffee Shops",
  restaurants: "Restaurants",
  landscapers: "Landscapers",
  other: "Custom / Other",
};

// Static list for LeadUpload selector (admin picks from these when uploading)
export const UPLOAD_CATEGORIES = [
  { value: "electricians", label: "Electricians" },
  { value: "general_contractors", label: "General Contractors" },
  { value: "roofing", label: "Roofing Companies" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "coffee_shops", label: "Coffee Shops" },
  { value: "restaurants", label: "Restaurants" },
  { value: "landscapers", label: "Landscapers" },
  { value: "other", label: "Custom / Other" },
] as const;

export type LeadCategory = typeof UPLOAD_CATEGORIES[number]["value"];

/**
 * Returns a friendly label for any category value.
 * Uses the known labels map, falls back to Title Case of the raw value.
 */
export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  if (KNOWN_LABELS[value]) return KNOWN_LABELS[value];
  // Auto-generate label: replace underscores with spaces, title case
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
