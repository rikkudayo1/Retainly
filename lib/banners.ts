export interface Banner {
  id: string;
  label: string;
  gradient: string;
}

export const BANNERS: Banner[] = [
  { id: "aurora",   label: "Aurora",   gradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" },
  { id: "sunset",   label: "Sunset",   gradient: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" },
  { id: "forest",   label: "Forest",   gradient: "linear-gradient(135deg, #134e4a, #22c55e, #166534)" },
  { id: "ocean",    label: "Ocean",    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #0f172a)" },
  { id: "crimson",  label: "Crimson",  gradient: "linear-gradient(135deg, #450a0a, #ef4444, #7f1d1d)" },
  { id: "midnight", label: "Midnight", gradient: "linear-gradient(135deg, #0f172a, #6366f1, #0f172a)" },
  { id: "rose",     label: "Rose",     gradient: "linear-gradient(135deg, #4c0519, #ec4899, #831843)" },
  { id: "gold",     label: "Gold",     gradient: "linear-gradient(135deg, #451a03, #f59e0b, #78350f)" },
  { id: "arctic",   label: "Arctic",   gradient: "linear-gradient(135deg, #e0f2fe, #7dd3fc, #0ea5e9)" },
  { id: "galaxy",   label: "Galaxy",   gradient: "linear-gradient(135deg, #1e1b4b, #7c3aed, #4c1d95)" },
  { id: "matcha",   label: "Matcha",   gradient: "linear-gradient(135deg, #14532d, #84cc16, #365314)" },
  { id: "candy",    label: "Candy",    gradient: "linear-gradient(135deg, #fdf2f8, #f9a8d4, #ec4899)" },
];

export const getBanner = (id: string): Banner =>
  BANNERS.find((b) => b.id === id) ?? BANNERS[0];