/**
 * Title normalisation.
 *
 * This is the first stage of the originality filter described in spec §3.4:
 * normalise -> strip stopwords/fillers -> expand synonyms and abbreviations,
 * before TF-IDF cosine and the lexical sub-signals score the result.
 *
 * The stopword list is deliberately aggressive about academic-project filler.
 * "Smart Attendance via Face Recognition" and "Smart Attendance Face
 * Recognition" are the same project; dropping `smart` and `via` is what makes
 * the engine say so.
 */

/** Filler words that carry no distinguishing meaning in a project title. */
export const STOPWORDS = new Set([
  // spec §3.4 names these explicitly
  "system", "application", "app", "project", "smart", "automated", "using",
  "based",
  // ordinary English function words
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "is", "of", "on", "or", "the", "to", "via", "with", "within", "through",
  // Further academic-title filler. Deliberately conservative: words that
  // carry real meaning in some titles are left in, because dropping them
  // would collide genuinely different projects. "design" (VLSI Design),
  // "model" (Language Model), "study", "platform" and "tool" all stay.
  "approach", "development", "framework", "implementation", "method",
  "novel", "solution", "technique", "efficient", "effective", "enhanced",
  "improved", "intelligent", "advanced",
]);

/**
 * Expanded before stopword removal, so an abbreviation and its expansion
 * collapse onto the same tokens. Keys are matched on word boundaries;
 * multi-word keys are matched as phrases first.
 */
export const SYNONYMS: Record<string, string> = {
  // abbreviations
  ml: "machine learning",
  ai: "artificial intelligence",
  dl: "deep learning",
  nlp: "natural language processing",
  cv: "computer vision",
  iot: "internet of things",
  ar: "augmented reality",
  vr: "virtual reality",
  ocr: "optical character recognition",
  gan: "generative adversarial network",
  cnn: "convolutional neural network",
  rnn: "recurrent neural network",
  api: "application programming interface",
  ui: "user interface",
  ux: "user experience",
  iiot: "industrial internet of things",
  // phrase-level equivalences
  "face id": "face recognition",
  "facial recognition": "face recognition",
  "face detection": "face recognition",
  "voice recognition": "speech recognition",
  "speech to text": "speech recognition",
  "text to speech": "speech synthesis",
  "e learning": "online learning",
  "e commerce": "online commerce",
  // single-word equivalences
  facial: "face",
  biometric: "biometrics",
  vehicular: "vehicle",
  agricultural: "agriculture",
  medicinal: "medical",
  healthcare: "health",
  educational: "education",
  surveillance: "monitoring",
  forecasting: "prediction",
  predictive: "prediction",
  classifier: "classification",
  detector: "detection",
  recogniser: "recognition",
  recognizer: "recognition",
  analytics: "analysis",
  analyser: "analysis",
  analyzer: "analysis",
  optimisation: "optimization",
  visualisation: "visualization",
  personalised: "personalized",
  centralised: "centralized",
  decentralised: "decentralized",
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Word-boundary anchored, not a plain substring replace: "machine learning"
 * contains "e learning", and a naive `split/join` would rewrite it to
 * "machinonline learning".
 */
const MULTI_WORD_SYNONYMS = Object.entries(SYNONYMS)
  .filter(([key]) => key.includes(" "))
  // Longest first, so "facial recognition" wins over "facial".
  .sort((a, b) => b[0].length - a[0].length)
  .map(
    ([phrase, replacement]) =>
      [new RegExp(`\\b${escapeRegex(phrase)}\\b`, "g"), replacement] as const,
  );

const SINGLE_WORD_SYNONYMS = new Map(
  Object.entries(SYNONYMS).filter(([key]) => !key.includes(" ")),
);

/** Lowercase, strip punctuation, collapse whitespace. */
export function cleanText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’“”]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crude plural stripping. Full stemming would over-merge distinct terms
 * ("mining"/"mine"), so this only handles the plural case that actually
 * causes false negatives in titles.
 */
function singularize(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("sses") || token.endsWith("shes") || token.endsWith("ches")) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us")) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Full pipeline: clean -> expand synonyms -> drop stopwords -> singularize.
 * Returns the surviving tokens in order, duplicates included.
 */
export function tokenize(input: string): string[] {
  let text = cleanText(input);

  for (const [pattern, replacement] of MULTI_WORD_SYNONYMS) {
    text = text.replace(pattern, replacement);
  }

  const expanded: string[] = [];
  for (const word of text.split(" ")) {
    if (!word) continue;
    const synonym = SINGLE_WORD_SYNONYMS.get(word);
    if (synonym) expanded.push(...synonym.split(" "));
    else expanded.push(word);
  }

  return expanded
    .filter((token) => !STOPWORDS.has(token))
    .map(singularize)
    .filter((token) => token.length > 1);
}

/**
 * Canonical string stored on ProjectTitle.normalizedTitle, so the corpus does
 * not have to be re-normalised on every similarity request.
 */
export function normalizeTitle(input: string): string {
  return tokenize(input).join(" ");
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Spec §3.4 thresholds: at or above 0.95 the submission is blocked, 0.80–0.94
 * is a warning the student can proceed through, below 0.80 is clean.
 */
export const BLOCK_THRESHOLD = 0.95;
export const WARN_THRESHOLD = 0.8;

/**
 * TF-IDF cosine is the primary score, as the academic report specifies. The
 * lexical signals are explainable cross-checks contributing the remaining 35%,
 * which stops a single measure from dominating: cosine alone under-reads a
 * near-duplicate whose shared words are common across the corpus, and edit
 * distance alone over-reads two unrelated titles of similar shape.
 */
const TFIDF_WEIGHT = 0.65;
const LEXICAL_WEIGHT = 0.35;

export type SignalBreakdown = {
  /** Primary signal. */
  tfidf: number;
  dice: number;
  containment: number;
  charNgram: number;
  levenshtein: number;
};

export type Verdict = "BLOCKED" | "WARNING" | "ALLOWED";

export type CorpusEntry = {
  id: string;
  title: string;
  /** Precomputed ProjectTitle.normalizedTitle; recomputed when absent. */
  normalizedTitle?: string | null;
  domainLabel?: string | null;
  guideLabel?: string | null;
  cycleLabel?: string | null;
};

export type SimilarityMatch = {
  id: string;
  title: string;
  score: number;
  signals: SignalBreakdown;
  /** Tokens present in both titles — the "which words matched" explanation. */
  sharedTerms: string[];
  domainLabel?: string | null;
  guideLabel?: string | null;
  cycleLabel?: string | null;
};

export type SimilarityReport = {
  /** Highest combined score across the corpus, 0–1. */
  score: number;
  verdict: Verdict;
  normalized: string;
  tokens: string[];
  best: SimilarityMatch | null;
  /** Top five matches, highest first. */
  matches: SimilarityMatch[];
  corpusSize: number;
};

function jaccardOfSets(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

export function diceOverlap(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

/** How much of the shorter title is contained in the longer one. */
export function containment(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

function charNgrams(text: string, n = 3): Set<string> {
  const padded = text.trim();
  const grams = new Set<string>();
  if (padded.length < n) {
    if (padded) grams.add(padded);
    return grams;
  }
  for (let i = 0; i <= padded.length - n; i++) {
    grams.add(padded.slice(i, i + n));
  }
  return grams;
}

/** Catches transpositions and typos that token overlap misses. */
export function charNgramSimilarity(a: string, b: string, n = 3) {
  return jaccardOfSets(charNgrams(a, n), charNgrams(b, n));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1, // insertion
        previous[j] + 1, // deletion
        previous[j - 1] + cost, // substitution
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length];
}

export function levenshteinRatio(a: string, b: string) {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

type IndexedDoc = {
  entry: CorpusEntry;
  tokens: string[];
  tokenSet: Set<string>;
  normalized: string;
};

export type CorpusIndex = {
  docs: IndexedDoc[];
  /** Document frequency per term. */
  df: Map<string, number>;
  size: number;
};

/**
 * Precompute tokens and document frequencies once per request, rather than
 * re-normalising the whole corpus for every comparison.
 */
export function buildCorpusIndex(entries: CorpusEntry[]): CorpusIndex {
  const docs: IndexedDoc[] = [];
  const df = new Map<string, number>();

  for (const entry of entries) {
    const normalized = entry.normalizedTitle?.trim()
      ? entry.normalizedTitle.trim()
      : normalizeTitle(entry.title);
    const tokens = normalized ? normalized.split(" ").filter(Boolean) : [];
    const tokenSet = new Set(tokens);
    for (const term of tokenSet) df.set(term, (df.get(term) ?? 0) + 1);
    docs.push({ entry, tokens, tokenSet, normalized });
  }

  return { docs, df, size: docs.length };
}

/** Smoothed IDF, so a term absent from the corpus still gets a finite weight. */
function idf(term: string, index: CorpusIndex) {
  const documentFrequency = index.df.get(term) ?? 0;
  return Math.log((index.size + 1) / (documentFrequency + 1)) + 1;
}

function tfidfVector(tokens: string[], index: CorpusIndex): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);

  const vector = new Map<string, number>();
  let norm = 0;
  for (const [term, count] of counts) {
    const weight = count * idf(term, index);
    vector.set(term, weight);
    norm += weight * weight;
  }

  // L2-normalise so cosine is a plain dot product and title length drops out.
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (const [term, weight] of vector) vector.set(term, weight / norm);
  }
  return vector;
}

export function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
  // Iterate the smaller vector; the product is zero wherever terms disagree.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other) dot += weight * other;
  }
  return Math.min(1, Math.max(0, dot));
}

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size || a.size === 0) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

export function verdictFor(score: number): Verdict {
  if (score >= BLOCK_THRESHOLD) return "BLOCKED";
  if (score >= WARN_THRESHOLD) return "WARNING";
  return "ALLOWED";
}

/**
 * Score a candidate title against a corpus.
 *
 * `excludeId` skips the candidate's own stored row, so re-checking a saved
 * title does not match it against itself.
 */
export function checkTitle(
  candidate: string,
  index: CorpusIndex,
  options: { excludeId?: string; limit?: number } = {},
): SimilarityReport {
  const limit = options.limit ?? 5;
  const tokens = tokenize(candidate);
  const normalized = tokens.join(" ");
  const tokenSet = new Set(tokens);

  const base: SimilarityReport = {
    score: 0,
    verdict: "ALLOWED",
    normalized,
    tokens,
    best: null,
    matches: [],
    corpusSize: index.size,
  };

  // Everything was filler; there is nothing distinctive left to compare.
  if (tokens.length === 0) return base;

  const candidateVector = tfidfVector(tokens, index);

  const matches: SimilarityMatch[] = [];
  for (const doc of index.docs) {
    if (options.excludeId && doc.entry.id === options.excludeId) continue;
    if (doc.tokens.length === 0) continue;

    const signals: SignalBreakdown = {
      tfidf: cosine(candidateVector, tfidfVector(doc.tokens, index)),
      dice: diceOverlap(tokenSet, doc.tokenSet),
      containment: containment(tokenSet, doc.tokenSet),
      charNgram: charNgramSimilarity(normalized, doc.normalized),
      levenshtein: levenshteinRatio(normalized, doc.normalized),
    };

    const lexicalMax = Math.max(
      signals.dice,
      signals.containment,
      signals.charNgram,
      signals.levenshtein,
    );

    // Same words in any order is the same project, whatever the weighted sum
    // works out to — this is the report's own worked example.
    const score = setsEqual(tokenSet, doc.tokenSet)
      ? 1
      : Math.min(1, TFIDF_WEIGHT * signals.tfidf + LEXICAL_WEIGHT * lexicalMax);

    matches.push({
      id: doc.entry.id,
      title: doc.entry.title,
      score,
      signals,
      sharedTerms: [...tokenSet].filter((term) => doc.tokenSet.has(term)),
      domainLabel: doc.entry.domainLabel,
      guideLabel: doc.entry.guideLabel,
      cycleLabel: doc.entry.cycleLabel,
    });
  }

  matches.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const top = matches.slice(0, limit);
  const score = top[0]?.score ?? 0;

  return {
    ...base,
    score,
    verdict: verdictFor(score),
    best: top[0] ?? null,
    matches: top,
  };
}
