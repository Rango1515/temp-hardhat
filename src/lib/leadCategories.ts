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
  uncategorized: "Uncategorized",
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

// Filler words to strip from filenames when auto-detecting category
const FILLER_WORDS = new Set([
  "leads", "lead", "list", "import", "file", "data", "contacts",
  "2024", "2025", "2026", "2027", "new", "updated", "final", "v2", "v3",
]);

/**
 * Extracts a category name from a filename.
 * Example: "fitness_leads_list.txt" → "fitness"
 */
export function extractCategoryFromFilename(filename: string): string {
  // Remove extension
  const withoutExt = filename.replace(/\.[^.]+$/, "");
  // Replace _ and - with spaces
  const spaced = withoutExt.replace(/[_-]/g, " ");
  // Split into words, remove filler words
  const words = spaced
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !FILLER_WORDS.has(w));

  if (words.length === 0) return "uncategorized";

  // Join remaining words with underscore for storage
  return words.join("_");
}

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
