/**
 * Color Map Utility
 * Maps color names to their hex codes for displaying color tiles/swatches
 * Case-insensitive matching with support for variations
 */

export interface ColorMapEntry {
  hex: string;
  aliases?: string[];
}

/**
 * Comprehensive color map with hex codes
 * Colors are matched case-insensitively and support common variations
 */
const COLOR_MAP: Record<string, ColorMapEntry> = {
  // Basic Colors
  black: { hex: "#000000" },
  white: { hex: "#FFFFFF" },
  gray: { hex: "#808080", aliases: ["grey"] },
  grey: { hex: "#808080" },
  silver: { hex: "#C0C0C0" },
  gold: { hex: "#FFD700" },

  // Reds
  red: { hex: "#FF0000" },
  crimson: { hex: "#DC143C" },
  scarlet: { hex: "#FF2400" },
  cherry: { hex: "#DE3163" },
  burgundy: { hex: "#800020" },
  maroon: { hex: "#800000" },
  brick: { hex: "#B22222" },
  rust: { hex: "#B7410E" },
  tomato: { hex: "#FF6347" },
  coral: { hex: "#FF7F50" },
  salmon: { hex: "#FA8072" },
  rose: { hex: "#FF007F" },
  pink: { hex: "#FFC0CB" },
  blush: { hex: "#DE5D83" },
  watermelon: { hex: "#FC6C85" },
  strawberry: { hex: "#FC5A8D" },
  raspberry: { hex: "#E30B5C" },

  // Blues
  blue: { hex: "#0000FF" },
  navy: { hex: "#000080" },
  "baby blue": { hex: "#89CFF0", aliases: ["babyblue", "baby-blue"] },
  sky: { hex: "#87CEEB" },
  "sky blue": { hex: "#87CEEB", aliases: ["skyblue"] },
  royal: { hex: "#4169E1", aliases: ["royal blue"] },
  "royal blue": { hex: "#4169E1", aliases: ["royalblue"] },
  electric: { hex: "#7DF9FF", aliases: ["electric blue"] },
  "electric blue": { hex: "#7DF9FF", aliases: ["electricblue"] },
  cornflower: { hex: "#6495ED", aliases: ["cornflower blue"] },
  "cornflower blue": { hex: "#6495ED", aliases: ["cornflowerblue"] },
  periwinkle: { hex: "#CCCCFF" },
  indigo: { hex: "#4B0082" },
  teal: { hex: "#008080" },
  cyan: { hex: "#00FFFF" },
  turquoise: { hex: "#40E0D0" },
  ocean: { hex: "#016064", aliases: ["ocean blue"] },
  "ocean blue": { hex: "#016064", aliases: ["oceanblue"] },
  aqua: { hex: "#00FFFF" },
  azure: { hex: "#F0FFFF" },

  // Greens
  green: { hex: "#008000" },
  forest: { hex: "#228B22", aliases: ["forest green"] },
  "forest green": { hex: "#228B22", aliases: ["forestgreen"] },
  emerald: { hex: "#50C878" },
  jade: { hex: "#00A86B" },
  olive: { hex: "#808000" },
  sage: { hex: "#87AE73" },
  moss: { hex: "#8A9A5B" },
  lime: { hex: "#00FF00" },
  "lime green": { hex: "#32CD32", aliases: ["limegreen"] },
  chartreuse: { hex: "#7FFF00" },
  mint: { hex: "#98FF98" },
  "mint green": { hex: "#98FF98", aliases: ["mintgreen"] },
  seafoam: { hex: "#71EEB8", aliases: ["sea foam", "sea-foam"] },
  "sea foam": { hex: "#71EEB8", aliases: ["seafoam", "sea-foam"] },

  // Yellows & Oranges
  yellow: { hex: "#FFFF00" },
  gold: { hex: "#FFD700" },
  amber: { hex: "#FFBF00" },
  mustard: { hex: "#FFDB58" },
  canary: { hex: "#FFEF00" },
  lemon: { hex: "#FFF700" },
  banana: { hex: "#FFE135" },
  orange: { hex: "#FFA500" },
  tangerine: { hex: "#FF9500" },
  apricot: { hex: "#FBCEB1" },
  peach: { hex: "#FFE5B4" },
  pumpkin: { hex: "#FF7518" },
  carrot: { hex: "#ED9121" },
  honey: { hex: "#FFC30B" },
  caramel: { hex: "#AF6E4D" },

  // Purples & Violets
  purple: { hex: "#800080" },
  violet: { hex: "#8B00FF" },
  lavender: { hex: "#E6E6FA" },
  lilac: { hex: "#C8A2C8" },
  plum: { hex: "#8E4585" },
  grape: { hex: "#6F2DA8" },
  mauve: { hex: "#E0B0FF" },
  dusty: { hex: "#B19CD9", aliases: ["dusty purple", "dusty mauve"] },
  "dusty purple": { hex: "#B19CD9", aliases: ["dustypurple", "dusty mauve"] },
  "dusty mauve": { hex: "#B19CD9", aliases: ["dustymauve", "dusty purple"] },
  orchid: { hex: "#DA70D6" },
  magenta: { hex: "#FF00FF" },
  fuchsia: { hex: "#FF00FF" },

  // Browns & Tans
  brown: { hex: "#A52A2A" },
  chocolate: { hex: "#7B3F00" },
  coffee: { hex: "#6F4E37" },
  caramel: { hex: "#AF6E4D" },
  tan: { hex: "#D2B48C" },
  beige: { hex: "#F5F5DC" },
  cream: { hex: "#FFFDD0" },
  ivory: { hex: "#FFFFF0" },
  vanilla: { hex: "#F3E5AB" },
  butter: { hex: "#FFFACD" },
  champagne: { hex: "#F7E7CE" },
  khaki: { hex: "#C3B091" },
  "dark khaki": { hex: "#BDB76B", aliases: ["darkkhaki"] },
  camel: { hex: "#C19A6B" },
  sand: { hex: "#C2B280" },
  wheat: { hex: "#F5DEB3" },

  // Grays & Neutrals
  charcoal: { hex: "#36454F" },
  slate: { hex: "#708090" },
  "slate gray": { hex: "#708090", aliases: ["slategray", "slate grey"] },
  "slate grey": { hex: "#708090", aliases: ["slategrey", "slate gray"] },
  "dark gray": { hex: "#A9A9A9", aliases: ["darkgray", "dark grey"] },
  "dark grey": { hex: "#A9A9A9", aliases: ["darkgrey", "dark gray"] },
  "light gray": { hex: "#D3D3D3", aliases: ["lightgray", "light grey"] },
  "light grey": { hex: "#D3D3D3", aliases: ["lightgrey", "light gray"] },

  // Special/Neon Colors
  neon: { hex: "#39FF14", aliases: ["neon green"] },
  "neon green": { hex: "#39FF14", aliases: ["neongreen"] },
  "hot pink": { hex: "#FF69B4", aliases: ["hotpink"] },
  hotpink: { hex: "#FF69B4" },
};

/**
 * Normalize color name for lookup
 * Converts to lowercase and handles common variations
 */
function normalizeColorName(colorName: string): string {
  return colorName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/-/g, " "); // Convert hyphens to spaces
}

/**
 * Get hex code for a color name
 * Supports case-insensitive matching and common variations
 * 
 * @param colorName - The color name to look up
 * @returns Hex code string (e.g., "#FF0000") or null if not found
 */
export function getColorHex(colorName: string): string | null {
  if (!colorName) return null;

  const normalized = normalizeColorName(colorName);

  // Direct lookup
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized].hex;
  }

  // Check aliases
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (value.aliases?.some((alias) => normalizeColorName(alias) === normalized)) {
      return value.hex;
    }
    // Also check if normalized name includes the key
    if (normalized.includes(key) && key.length > 2) {
      return value.hex;
    }
  }

  // Fallback: try partial matching for compound colors
  // e.g., "baby blue" -> check for "baby" and "blue"
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (COLOR_MAP[word] && word.length > 2) {
      return COLOR_MAP[word].hex;
    }
  }

  return null;
}

/**
 * Get hex code with fallback
 * Returns a default color if the color name is not found
 * 
 * @param colorName - The color name to look up
 * @param fallback - Fallback hex code (default: "#CCCCCC" - light gray)
 * @returns Hex code string
 */
export function getColorHexWithFallback(
  colorName: string,
  fallback: string = "#CCCCCC"
): string {
  return getColorHex(colorName) || fallback;
}

/**
 * Check if a color name exists in the color map
 * 
 * @param colorName - The color name to check
 * @returns True if the color exists in the map
 */
export function hasColor(colorName: string): boolean {
  return getColorHex(colorName) !== null;
}

/**
 * Get all available color names
 * 
 * @returns Array of color names
 */
export function getAllColorNames(): string[] {
  return Object.keys(COLOR_MAP);
}

