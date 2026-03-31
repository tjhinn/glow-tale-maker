/**
 * Maps common color names to hex values for consistent rendering
 */
const COLOR_MAP: Record<string, string> = {
  // Primary colors
  red: '#E53935',
  blue: '#1E88E5',
  yellow: '#FDD835',
  
  // Secondary colors
  green: '#43A047',
  orange: '#FB8C00',
  purple: '#8E24AA',
  
  // Tertiary / child-friendly colors
  pink: '#EC407A',
  teal: '#00897B',
  cyan: '#00BCD4',
  magenta: '#E91E63',
  lime: '#CDDC39',
  indigo: '#3F51B5',
  violet: '#7C4DFF',
  
  // Neutrals & metallics
  gold: '#FFD700',
  silver: '#9E9E9E',
  brown: '#795548',
  navy: '#1A237E',
  maroon: '#880E4F',
  coral: '#FF7043',
  turquoise: '#26A69A',
  lavender: '#B39DDB',
  peach: '#FFAB91',
  mint: '#80CBC4',
  salmon: '#FF8A80',
  sky: '#81D4FA',
  
  // Dropdown options
  'light pink': '#F48FB1',
  'sky blue': '#64B5F6',
  'light coral': '#E57373',
  lilac: '#CE93D8',
  'dark orange': '#E65100',
  'light green': '#81C784',
  'dark green': '#2E7D32',
  'dark blue': '#1565C0',
  'bold purple': '#7B1FA2',
  'bold red': '#C62828',

  // Basic
  white: '#FFFFFF',
  black: '#212121',
};

/**
 * Converts a color name to its hex value
 * @param colorName - User-provided color name (e.g., "blue", "pink")
 * @returns Hex color value or the original input if not found in map
 */
export const getColorValue = (colorName: string): string => {
  if (!colorName) return '';
  const normalized = colorName.toLowerCase().trim();
  return COLOR_MAP[normalized] || colorName;
};
