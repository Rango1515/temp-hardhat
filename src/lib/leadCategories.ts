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
 * Simple Levenshtein distance for fuzzy matching.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Tries to match a raw extracted value to the closest known category.
 * Checks: exact match → prefix/substring → Levenshtein distance ≤ 3.
 */
function matchToKnownCategory(raw: string): string | null {
  const knownKeys = Object.keys(KNOWN_LABELS);

  // Exact match
  if (KNOWN_LABELS[raw]) return raw;

  // Check if raw is a prefix of a known key (e.g., "electric" → "electricians")
  for (const key of knownKeys) {
    if (key.startsWith(raw) || raw.startsWith(key)) return key;
  }

  // Check if raw is a substring of a known key or vice versa
  for (const key of knownKeys) {
    if (key.includes(raw) || raw.includes(key)) return key;
  }

  // Fuzzy match using Levenshtein distance (threshold ≤ 3)
  let bestKey: string | null = null;
  let bestDist = Infinity;
  for (const key of knownKeys) {
    const dist = levenshtein(raw, key);
    if (dist < bestDist) {
      bestDist = dist;
      bestKey = key;
    }
  }
  if (bestDist <= 3 && bestKey) return bestKey;

  // Also check against labels (lowercased, underscored)
  for (const [key, label] of Object.entries(KNOWN_LABELS)) {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, "_");
    if (normalizedLabel === raw || normalizedLabel.startsWith(raw) || raw.startsWith(normalizedLabel)) return key;
    const dist = levenshtein(raw, normalizedLabel);
    if (dist <= 3) return key;
  }

  return null;
}

/**
 * Extracts a category name from a filename with auto spell-check.
 * Example: "fitness_leads_list.txt" → "fitness"
 * Example: "electrcians_leads.txt" → "electricians" (fuzzy matched)
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
  const raw = words.join("_");

  // Try to match to a known category (spell check)
  const matched = matchToKnownCategory(raw);
  if (matched) return matched;

  // Also try matching individual words if multi-word
  if (words.length > 1) {
    for (const word of words) {
      const wordMatch = matchToKnownCategory(word);
      if (wordMatch) return wordMatch;
    }
  }

  return raw;
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
