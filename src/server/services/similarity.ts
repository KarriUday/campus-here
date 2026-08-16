/**
 * Title normalisation & Semantic Originality Engine.
 *
 * Combines Semantic Concept Embeddings, TF-IDF Cosine Similarity, and Lexical Signals
 * to identify both verbatim duplicates and semantically equivalent projects.
 * Also carries senior metadata (GitHub links, Drive folders, Author details) for matches > 70%.
 */

/** Filler words that carry no distinguishing meaning in a project title. */
export const STOPWORDS = new Set([
  "system", "application", "app", "project", "smart", "automated", "using",
  "based", "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "in", "into", "is", "of", "on", "or", "the", "to", "via", "with", "within",
  "through", "approach", "development", "framework", "implementation", "method",
  "novel", "solution", "technique", "efficient", "effective", "enhanced",
  "improved", "intelligent", "advanced",
]);

/**
 * Expanded before stopword removal, so abbreviations and synonyms collapse onto identical tokens.
 */
export const SYNONYMS: Record<string, string> = {
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
  "face id": "face recognition",
  "facial recognition": "face recognition",
  "face detection": "face recognition",
  "voice recognition": "speech recognition",
  "speech to text": "speech recognition",
  "text to speech": "speech synthesis",
  "e learning": "online learning",
  "e commerce": "online commerce",
  "cold chain": "supply chain temperature logistics",
  "vaccine transport": "immunization cold chain distribution",
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
  drowsiness: "fatigue detection",
  sleepy: "fatigue detection",
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MULTI_WORD_SYNONYMS = Object.entries(SYNONYMS)
  .filter(([key]) => key.includes(" "))
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

/** Full normalisation pipeline. */
export function tokenize(input: string): string[] {
  let text = cleanText(input);

  for (const [pattern, replacement] of MULTI_WORD_SYNONYMS) {
    text = text.replace(pattern, replacement);
  }

  const expanded: string[] = [];
  for (const word of text.split(" ")) {
    if (!word) continue;
    const synonym = SINGLE_WORD_SYNONYMS.get(word);
    if (synonym) {
      for (const part of synonym.split(" ")) expanded.push(part);
    } else {
      expanded.push(word);
    }
  }

  const tokens: string[] = [];
  for (const token of expanded) {
    if (STOPWORDS.has(token)) continue;
    const s = singularize(token);
    if (s.length >= 2 && !STOPWORDS.has(s)) tokens.push(s);
  }

  return tokens;
}

export function normalizeTitle(input: string): string {
  return tokenize(input).join(" ");
}

// ---------------------------------------------------------------------------
// Semantic Concept Vector Ontology
// ---------------------------------------------------------------------------

/**
 * Domain semantic concept clusters used to compute high-level concept embeddings.
 * Maps cross-domain technical concepts even when vocabulary differs.
 */
const SEMANTIC_CONCEPTS: Array<{ name: string; weight: number; terms: string[] }> = [
  {
    name: "cold_chain_supply_blockchain",
    weight: 1.5,
    terms: ["cold", "chain", "vaccine", "immunization", "temperature", "supply", "logistics", "ledger", "blockchain", "ethereum", "hyperledger", "integrity", "transport", "shipment", "iot", "sensor", "provenance"],
  },
  {
    name: "computer_vision_attendance_face",
    weight: 1.4,
    terms: ["face", "recognition", "facial", "attendance", "camera", "opencv", "yolo", "biometric", "detection", "classroom", "student", "surveillance"],
  },
  {
    name: "driver_fatigue_safety_vision",
    weight: 1.4,
    terms: ["driver", "drowsiness", "fatigue", "eye", "blink", "sleep", "alert", "accident", "vehicle", "monitoring", "road", "safety"],
  },
  {
    name: "medical_healthcare_diagnosis",
    weight: 1.5,
    terms: ["medical", "health", "healthcare", "cancer", "tumor", "xray", "mri", "disease", "diagnosis", "patient", "clinical", "pneumonia", "cardiac", "diabetes", "skin", "lesion"],
  },
  {
    name: "nlp_summarization_llm",
    weight: 1.3,
    terms: ["nlp", "text", "summarization", "llm", "transformer", "bert", "gpt", "sentiment", "chatbot", "translation", "language", "document"],
  },
  {
    name: "cybersecurity_intrusion_threat",
    weight: 1.4,
    terms: ["security", "cybersecurity", "threat", "intrusion", "malware", "phishing", "vulnerability", "encryption", "firewall", "attack", "cryptography", "privacy", "zero", "trust"],
  },
  {
    name: "smart_agriculture_irrigation",
    weight: 1.3,
    terms: ["agriculture", "crop", "soil", "moisture", "irrigation", "plant", "leaf", "disease", "farming", "fertilizer", "weather", "iot"],
  },
  {
    name: "fintech_fraud_credit",
    weight: 1.3,
    terms: ["finance", "banking", "fraud", "credit", "card", "transaction", "loan", "payment", "stock", "trading", "risk", "crypto"],
  },
  {
    name: "cloud_devops_kubernetes",
    weight: 1.2,
    terms: ["cloud", "kubernetes", "docker", "container", "microservices", "aws", "serverless", "devops", "pipeline", "load", "scalability"],
  },
];

/**
 * Builds a dense semantic concept vector for any tokenized text.
 */
function buildSemanticVector(tokens: string[]): number[] {
  const tokenSet = new Set(tokens);
  const vector: number[] = new Array(SEMANTIC_CONCEPTS.length).fill(0);

  for (let i = 0; i < SEMANTIC_CONCEPTS.length; i++) {
    const concept = SEMANTIC_CONCEPTS[i];
    let matchCount = 0;
    for (const term of concept.terms) {
      if (tokenSet.has(term)) matchCount += 1;
    }
    if (matchCount > 0) {
      // Density score scaled by concept importance
      vector[i] = (matchCount / Math.max(1, Math.min(tokens.length, concept.terms.length))) * concept.weight;
    }
  }

  // L2-normalize
  let norm = 0;
  for (const val of vector) norm += val * val;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) vector[i] /= norm;
  }

  return vector;
}

/** Cosine similarity between two dense vectors. */
function denseCosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return Math.min(1, Math.max(0, dot));
}

// ---------------------------------------------------------------------------
// Scoring & Data Models
// ---------------------------------------------------------------------------

export const BLOCK_THRESHOLD = 0.95;
export const WARN_THRESHOLD = 0.80; // 80%+ is WARNING; 70%+ reveals senior prior-art
export const PRIOR_ART_THRESHOLD = 0.70;

export type Verdict = "BLOCKED" | "WARNING" | "ALLOWED";

export type SeniorAuthor = {
  name: string;
  usn: string;
  batch: string;
};

export type CorpusEntry = {
  id: string;
  title: string;
  normalizedTitle?: string | null;
  domainLabel?: string | null;
  guideLabel?: string | null;
  cycleLabel?: string | null;
  seniorAuthors?: SeniorAuthor[] | null;
  githubUrl?: string | null;
  driveUrl?: string | null;
  projectAbstract?: string | null;
};

export type SignalBreakdown = {
  semantic: number;
  tfidf: number;
  dice: number;
  containment: number;
  charNgram: number;
  levenshtein: number;
};

export type SimilarityMatch = {
  id: string;
  title: string;
  score: number;
  signals: SignalBreakdown;
  sharedTerms: string[];
  domainLabel?: string | null;
  guideLabel?: string | null;
  cycleLabel?: string | null;
  seniorAuthors?: SeniorAuthor[] | null;
  githubUrl?: string | null;
  driveUrl?: string | null;
  projectAbstract?: string | null;
};

export type SimilarityReport = {
  score: number;
  verdict: Verdict;
  normalized: string;
  tokens: string[];
  best: SimilarityMatch | null;
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
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
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
  semanticVector: number[];
};

export type CorpusIndex = {
  docs: IndexedDoc[];
  df: Map<string, number>;
  size: number;
};

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
    const semanticVector = buildSemanticVector(tokens);
    docs.push({ entry, tokens, tokenSet, normalized, semanticVector });
  }

  return { docs, df, size: docs.length };
}

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

  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (const [term, weight] of vector) vector.set(term, weight / norm);
  }
  return vector;
}

export function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
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
 * Score a candidate title against the entire historical corpus using Semantic Vectors + TF-IDF + Lexical Signals.
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

  if (tokens.length === 0) return base;

  const candidateVector = tfidfVector(tokens, index);
  const candidateSemanticVector = buildSemanticVector(tokens);

  const matches: SimilarityMatch[] = [];
  for (const doc of index.docs) {
    if (options.excludeId && doc.entry.id === options.excludeId) continue;
    if (doc.tokens.length === 0) continue;

    const semanticSim = denseCosine(candidateSemanticVector, doc.semanticVector);
    const tfidfSim = cosine(candidateVector, tfidfVector(doc.tokens, index));

    const signals: SignalBreakdown = {
      semantic: Math.round(semanticSim * 1000) / 1000,
      tfidf: Math.round(tfidfSim * 1000) / 1000,
      dice: Math.round(diceOverlap(tokenSet, doc.tokenSet) * 1000) / 1000,
      containment: Math.round(containment(tokenSet, doc.tokenSet) * 1000) / 1000,
      charNgram: Math.round(charNgramSimilarity(normalized, doc.normalized) * 1000) / 1000,
      levenshtein: Math.round(levenshteinRatio(normalized, doc.normalized) * 1000) / 1000,
    };

    const lexicalMax = Math.max(
      signals.dice,
      signals.containment,
      signals.charNgram,
      signals.levenshtein,
    );

    // Multi-tier composite score:
    // 0.20 Semantic Concept Cosine + 0.55 TF-IDF Cosine + 0.25 Lexical Overlap Max
    let score = setsEqual(tokenSet, doc.tokenSet)
      ? 1.0
      : Math.min(1, 0.20 * signals.semantic + 0.55 * signals.tfidf + 0.25 * lexicalMax);

    // High semantic synergy boost for near-duplicate projects
    if (signals.semantic >= 0.85 && signals.tfidf >= 0.60) {
      score = Math.max(score, Math.min(0.96, signals.semantic * 0.40 + signals.tfidf * 0.60));
    }

    score = Math.round(score * 100) / 100;

    matches.push({
      id: doc.entry.id,
      title: doc.entry.title,
      score,
      signals,
      sharedTerms: [...tokenSet].filter((term) => doc.tokenSet.has(term)),
      domainLabel: doc.entry.domainLabel,
      guideLabel: doc.entry.guideLabel,
      cycleLabel: doc.entry.cycleLabel,
      seniorAuthors: doc.entry.seniorAuthors ?? null,
      githubUrl: doc.entry.githubUrl ?? null,
      driveUrl: doc.entry.driveUrl ?? null,
      projectAbstract: doc.entry.projectAbstract ?? null,
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
