export interface PlaceholderValues {
  heroName?: string;
  petName?: string;
  petType?: string;
  favoriteColor?: string;
  favoriteFood?: string;
  city?: string;
}

export function replacePlaceholders(text: string, values: PlaceholderValues): string {
  if (!text) return text;
  return text
    .replace(/\{heroName\}/g, values.heroName || "")
    .replace(/\{petName\}/g, values.petName || "")
    .replace(/\{petType\}/g, values.petType || "")
    .replace(/\{favoriteColor\}/g, values.favoriteColor || "")
    .replace(/\{favoriteFood\}/g, values.favoriteFood || "")
    .replace(/\{city\}/g, values.city || "");
}