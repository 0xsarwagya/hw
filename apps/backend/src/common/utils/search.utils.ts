/**
 * Search query parsing and processing utilities
 */

/**
 * Parse search query into tokens
 * Handles:
 * - Multiple keywords
 * - Quoted phrases
 * - Special operators (if needed in future)
 * @param query - Raw search query
 * @returns Parsed query with tokens and phrases
 */
export interface ParsedQuery {
  keywords: string[];
  phrases: string[];
  rawQuery: string;
}

export function parseSearchQuery(query: string): ParsedQuery {
  if (!query || typeof query !== "string") {
    return { keywords: [], phrases: [], rawQuery: "" };
  }

  const trimmed = query.trim();
  const keywords: string[] = [];
  const phrases: string[] = [];

  // Extract quoted phrases
  const phraseRegex = /"([^"]+)"/g;
  const phraseMatches = trimmed.matchAll(phraseRegex);
  for (const match of phraseMatches) {
    phrases.push(match[1].trim());
  }

  // Remove quoted phrases from text and split into keywords
  const textWithoutPhrases = trimmed.replace(phraseRegex, "").trim();
  const keywordTokens = textWithoutPhrases
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  keywords.push(...keywordTokens);

  return {
    keywords,
    phrases,
    rawQuery: trimmed,
  };
}

/**
 * Build search pattern for PostgreSQL ILIKE
 * Creates pattern that matches any of the keywords/phrases
 * @param parsedQuery - Parsed query
 * @returns Search pattern string
 */
export function buildSearchPattern(parsedQuery: ParsedQuery): string {
  const allTerms = [...parsedQuery.keywords, ...parsedQuery.phrases];

  if (allTerms.length === 0) {
    return "";
  }

  // For exact match, use the first term
  // For fuzzy match, use %term% pattern
  return allTerms[0];
}

/**
 * Build multiple search patterns for each keyword/phrase
 * @param parsedQuery - Parsed query
 * @returns Array of search patterns
 */
export function buildSearchPatterns(parsedQuery: ParsedQuery): string[] {
  const allTerms = [...parsedQuery.keywords, ...parsedQuery.phrases];
  return allTerms.map((term) => `%${term}%`);
}

/**
 * Calculate relevance score for a search result
 * Higher score = more relevant
 * @param product - Product data
 * @param query - Search query
 * @param parsedQuery - Parsed query
 * @param matchingSku - SKU that matched (if any)
 * @returns Relevance score (0-1)
 */
export function calculateRelevanceScore(
  product: {
    title: string;
    description: string | null;
  },
  query: string,
  parsedQuery: ParsedQuery,
  matchingSku?: string | null,
): number {
  const queryLower = query.toLowerCase();
  const titleLower = product.title.toLowerCase();
  const descriptionLower = (product.description || "").toLowerCase();

  let score = 0;

  // Exact title match gets highest score
  if (titleLower === queryLower) {
    score += 1.0;
  } else if (titleLower.includes(queryLower)) {
    // Title contains query
    const position = titleLower.indexOf(queryLower);
    // Earlier in title = higher score
    score += 0.8 * (1 - position / titleLower.length);
  } else {
    // Check for keyword matches in title
    for (const keyword of parsedQuery.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        score += 0.6 / parsedQuery.keywords.length;
      }
    }
  }

  // Description matches get lower weight
  if (descriptionLower.includes(queryLower)) {
    score += 0.3;
  } else {
    for (const keyword of parsedQuery.keywords) {
      if (descriptionLower.includes(keyword.toLowerCase())) {
        score += 0.2 / parsedQuery.keywords.length;
      }
    }
  }

  // SKU match gets high score
  if (matchingSku) {
    score += 0.9;
  }

  // Normalize to 0-1 range
  return Math.min(1.0, score);
}

/**
 * Check if query looks like a SKU
 * SKUs are typically alphanumeric, may contain dashes/underscores
 * @param query - Search query
 * @returns true if query looks like a SKU
 */
export function isLikelySku(query: string): boolean {
  if (!query || query.length < 3 || query.length > 50) {
    return false;
  }

  // SKU pattern: alphanumeric with possible dashes/underscores, no spaces
  const skuPattern = /^[A-Z0-9_-]+$/i;
  return skuPattern.test(query.trim());
}
