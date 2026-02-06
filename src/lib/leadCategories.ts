export const LEAD_CATEGORIES = [
  { value: "electricians", label: "Electricians" },
  { value: "general_contractors", label: "General Contractors" },
  { value: "roofing", label: "Roofing Companies" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "coffee_shops", label: "Coffee Shops" },
  { value: "restaurants", label: "Restaurants" },
  { value: "other", label: "Custom / Other" },
] as const;

export type LeadCategory = typeof LEAD_CATEGORIES[number]["value"];

export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const found = LEAD_CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}
