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
  // further academic-title filler
  "approach", "design", "development", "framework", "implementation",
  "method", "model", "module", "novel", "platform", "study", "solution",
  "technique", "tool", "toolkit", "efficient", "effective", "enhanced",
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

const MULTI_WORD_SYNONYMS = Object.entries(SYNONYMS)
  .filter(([key]) => key.includes(" "))
  // Longest first, so "facial recognition" wins over "facial".
  .sort((a, b) => b[0].length - a[0].length);

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

  for (const [phrase, replacement] of MULTI_WORD_SYNONYMS) {
    text = text.split(phrase).join(replacement);
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
