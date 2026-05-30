// Smart search engine for food items.
// - Normalizes queries (lowercase, strip punctuation, collapse whitespace)
// - Expands synonyms (paneer↔cottage cheese, biryani↔biriyani, veggie↔veg)
// - Drops stop words ("with", "and", "the")
// - Token scoring: exact > prefix > substring > fuzzy (Levenshtein ≤ 1)
// - Boosts trending items and restaurant-name matches
// No external deps, runs in <1ms on this dataset.

import { FOOD_ITEMS, type FoodItem } from "@/data/mockData";

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "with", "and", "or", "in", "on", "for", "to", "my",
  "please", "want", "get", "order", "some", "food", "meal", "dish",
]);

// Bi-directional synonym groups. Each token in a group is treated as equivalent.
const SYNONYM_GROUPS: string[][] = [
  ["veg", "vegetarian", "vegg", "veggie"],
  ["nonveg", "non-veg", "non", "nonvegetarian"],
  ["chicken", "chiken", "murgh", "murg"],
  ["paneer", "cottage", "cheese"],
  ["biryani", "biriyani", "biryanni", "briyani", "biriani"],
  ["pizza", "piza", "pizzas"],
  ["burger", "burgur", "buger"],
  ["fries", "fry", "fried"],
  ["rice", "ric"],
  ["dosa", "dosaa"],
  ["thali", "thaali", "platter", "combo"],
  ["shake", "milkshake", "smoothie"],
  ["coke", "cola", "pepsi", "soda"],
  ["roll", "wrap", "frankie", "kathi"],
  ["noodles", "noodle", "hakka", "chowmein", "chow"],
  ["masala", "spicy", "tikka"],
  ["margherita", "margarita", "marg"],
];

const SYNONYM_MAP = (() => {
  const map = new Map<string, string>();
  for (const group of SYNONYM_GROUPS) {
    const canonical = group[0];
    for (const word of group) map.set(word, canonical);
  }
  return map;
})();

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t && !STOP_WORDS.has(t))
    .map((t) => SYNONYM_MAP.get(t) ?? t);
}

// Bounded Levenshtein — early exit if distance exceeds `max`.
function levenshtein(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  const prev = new Array(n + 1).fill(0).map((_, i) => i);
  const curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    for (let k = 0; k <= n; k++) prev[k] = curr[k];
  }
  return prev[n];
}

// Score how well a single query token matches any of the haystack tokens.
function scoreToken(qToken: string, hayTokens: string[]): number {
  let best = 0;
  for (const h of hayTokens) {
    if (h === qToken) return 10;             // exact
    if (h.startsWith(qToken)) best = Math.max(best, 7);
    else if (qToken.length >= 3 && h.includes(qToken)) best = Math.max(best, 5);
    else if (qToken.length >= 4) {
      const d = levenshtein(qToken, h, 1);
      if (d <= 1) best = Math.max(best, 4);  // fuzzy typo
    }
  }
  return best;
}

export type SearchResult = { food: FoodItem; score: number };

export function smartSearch(query: string): SearchResult[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) {
    return FOOD_ITEMS.map((f) => ({ food: f, score: f.trending ? 1 : 0 }));
  }

  const results: SearchResult[] = [];
  for (const food of FOOD_ITEMS) {
    const nameTokens = tokenize(food.name);
    const catTokens = tokenize(food.category);
    const restoTokens = tokenize(food.offers.map((o) => o.restaurant).join(" "));

    let score = 0;
    let matchedCount = 0;

    for (const qt of qTokens) {
      const nameScore = scoreToken(qt, nameTokens);
      const catScore = scoreToken(qt, catTokens) * 0.6;
      const restoScore = scoreToken(qt, restoTokens) * 0.4;
      const tokenBest = Math.max(nameScore, catScore, restoScore);
      if (tokenBest > 0) matchedCount++;
      score += tokenBest;
    }

    // Require at least one strong match (avoid pure-noise results)
    if (matchedCount === 0) continue;

    // Coverage bonus: matching all query tokens beats matching one
    score *= matchedCount / qTokens.length;

    // Small trending boost as a tiebreaker
    if (food.trending) score += 0.5;

    results.push({ food, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

// Lightweight suggestions for the search bar dropdown.
export function suggest(query: string, limit = 6): FoodItem[] {
  return smartSearch(query).slice(0, limit).map((r) => r.food);
}
