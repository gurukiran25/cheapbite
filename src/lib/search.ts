// Smart search engine v2.
// Improvements over v1:
//  - Bigram / phrase matching ("fried rice" boosts items containing the phrase)
//  - Character n-gram (trigram) matching for short queries ("biry" → biryani)
//  - "Did you mean" — suggests a corrected query if no strong matches
//  - Restaurant-level results alongside food results
//  - Per-item token cache (built once)
//  - Highlight ranges so the UI can bold matched portions

import { FOOD_ITEMS, type FoodItem, type Offer } from "@/data/mockData";

const STOP_WORDS = new Set([
  "the","a","an","of","with","and","or","in","on","for","to","my",
  "please","want","get","order","some","food","meal","dish","near","me",
]);

const SYNONYM_GROUPS: string[][] = [
  ["veg","vegetarian","vegg","veggie"],
  ["nonveg","non","nonvegetarian"],
  ["chicken","chiken","murgh","murg"],
  ["paneer","cottage","cheese"],
  ["biryani","biriyani","biryanni","briyani","biriani","biryni"],
  ["pizza","piza","pizzas"],
  ["burger","burgur","buger"],
  ["fries","fry","fried"],
  ["rice","ric","riice"],
  ["dosa","dosaa","dosai"],
  ["thali","thaali","platter","combo"],
  ["shake","milkshake","smoothie"],
  ["coke","cola","pepsi","soda"],
  ["roll","wrap","frankie","kathi"],
  ["noodles","noodle","hakka","chowmein","chow"],
  ["masala","spicy","tikka"],
  ["margherita","margarita","marg"],
  ["mcaloo","aloo","potato"],
  ["chocolate","choco","choclate"],
];

const SYNONYM_MAP = (() => {
  const m = new Map<string, string>();
  for (const g of SYNONYM_GROUPS) for (const w of g) m.set(w, g[0]);
  return m;
})();

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

function tokenize(s: string): string[] {
  return norm(s).split(" ").filter((t) => t && !STOP_WORDS.has(t)).map((t) => SYNONYM_MAP.get(t) ?? t);
}

function bigrams(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) out.push(`${tokens[i]} ${tokens[i + 1]}`);
  return out;
}

function trigrams(word: string): Set<string> {
  const w = `  ${word} `;
  const grams = new Set<string>();
  for (let i = 0; i < w.length - 2; i++) grams.add(w.slice(i, i + 3));
  return grams;
}

function trigramOverlap(a: string, b: string): number {
  const A = trigrams(a), B = trigrams(b);
  let shared = 0;
  for (const g of A) if (B.has(g)) shared++;
  return shared / Math.max(A.size, B.size, 1);
}

function levenshtein(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  const prev = Array.from({ length: n + 1 }, (_, i) => i);
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

// Vocabulary, built once, used for "did you mean" suggestions.
const VOCAB: string[] = (() => {
  const set = new Set<string>();
  for (const f of FOOD_ITEMS) {
    for (const t of tokenize(f.name)) set.add(t);
    for (const o of f.offers) for (const t of tokenize(o.restaurant)) set.add(t);
  }
  return [...set];
})();

function correctToken(tok: string): string | null {
  if (tok.length < 3) return null;
  if (VOCAB.includes(tok)) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const v of VOCAB) {
    if (Math.abs(v.length - tok.length) > 2) continue;
    const d = levenshtein(tok, v, 2);
    if (d <= 2) {
      const score = trigramOverlap(tok, v) + (1 - d / Math.max(tok.length, v.length));
      if (score > bestScore) { bestScore = score; best = v; }
    }
  }
  return bestScore > 0.5 ? best : null;
}

export function didYouMean(query: string): string | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;
  let changed = false;
  const fixed = tokens.map((t) => {
    const c = correctToken(t);
    if (c && c !== t) { changed = true; return c; }
    return t;
  });
  return changed ? fixed.join(" ") : null;
}

function scoreToken(qTok: string, hayTokens: string[]): number {
  let best = 0;
  for (const h of hayTokens) {
    if (h === qTok) return 10;
    if (h.startsWith(qTok)) best = Math.max(best, 7);
    else if (qTok.length >= 3 && h.includes(qTok)) best = Math.max(best, 5);
    else if (qTok.length >= 4) {
      const d = levenshtein(qTok, h, 1);
      if (d <= 1) best = Math.max(best, 4);
    }
    if (best < 3 && qTok.length >= 3) {
      const ov = trigramOverlap(qTok, h);
      if (ov >= 0.5) best = Math.max(best, Math.round(ov * 6));
    }
  }
  return best;
}

// Pre-tokenized index built once per module load.
type Indexed = {
  food: FoodItem;
  nameTokens: string[];
  catTokens: string[];
  restoTokens: string[];
  nameBigrams: string[];
};

const INDEX: Indexed[] = FOOD_ITEMS.map((f) => {
  const nameTokens = tokenize(f.name);
  return {
    food: f,
    nameTokens,
    catTokens: tokenize(f.category),
    restoTokens: tokenize(f.offers.map((o) => o.restaurant).join(" ")),
    nameBigrams: bigrams(nameTokens),
  };
});

export type SearchResult = { food: FoodItem; score: number };

export function smartSearch(query: string): SearchResult[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) {
    return FOOD_ITEMS.map((f) => ({ food: f, score: f.trending ? 1 : 0 }));
  }
  const qBigrams = bigrams(qTokens);

  const results: SearchResult[] = [];
  for (const it of INDEX) {
    let score = 0;
    let matched = 0;

    for (const qt of qTokens) {
      const s = Math.max(
        scoreToken(qt, it.nameTokens),
        scoreToken(qt, it.catTokens) * 0.6,
        scoreToken(qt, it.restoTokens) * 0.4,
      );
      if (s > 0) matched++;
      score += s;
    }

    // Phrase boost — "fried rice" should beat unrelated rice/fried hits
    for (const qb of qBigrams) {
      if (it.nameBigrams.includes(qb)) score += 8;
    }

    if (matched === 0) continue;
    score *= matched / qTokens.length;        // coverage
    if (it.food.trending) score += 0.5;       // tiebreaker

    results.push({ food: it.food, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

export type RestoResult = { restaurant: string; platforms: number; offers: Offer[]; score: number };

export function searchRestaurants(query: string, limit = 5): RestoResult[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const byName = new Map<string, Offer[]>();
  for (const f of FOOD_ITEMS) for (const o of f.offers) {
    if (!byName.has(o.restaurant)) byName.set(o.restaurant, []);
    byName.get(o.restaurant)!.push(o);
  }
  const out: RestoResult[] = [];
  for (const [name, offers] of byName) {
    const tokens = tokenize(name);
    let score = 0;
    for (const qt of qTokens) score += scoreToken(qt, tokens);
    if (score <= 0) continue;
    out.push({ restaurant: name, platforms: new Set(offers.map((o) => o.platformId)).size, offers, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function suggest(query: string, limit = 6): FoodItem[] {
  return smartSearch(query).slice(0, limit).map((r) => r.food);
}

// UI helper: return ranges to highlight inside a string for given query tokens.
export function highlight(text: string, query: string): Array<{ text: string; match: boolean }> {
  const qTokens = tokenize(query).filter((t) => t.length >= 2);
  if (qTokens.length === 0) return [{ text, match: false }];
  // Expand synonyms back-ish: also try original raw tokens as substrings
  const needles = new Set<string>([
    ...qTokens,
    ...norm(query).split(" ").filter((t) => t.length >= 2),
  ]);
  const lower = text.toLowerCase();
  const hits: Array<[number, number]> = [];
  for (const n of needles) {
    let i = 0;
    while ((i = lower.indexOf(n, i)) !== -1) { hits.push([i, i + n.length]); i += n.length; }
  }
  if (hits.length === 0) return [{ text, match: false }];
  hits.sort((a, b) => a[0] - b[0]);
  // Merge overlaps
  const merged: Array<[number, number]> = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h[0] <= last[1]) last[1] = Math.max(last[1], h[1]);
    else merged.push([h[0], h[1]]);
  }
  const out: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const [a, b] of merged) {
    if (a > cursor) out.push({ text: text.slice(cursor, a), match: false });
    out.push({ text: text.slice(a, b), match: true });
    cursor = b;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), match: false });
  return out;
}
