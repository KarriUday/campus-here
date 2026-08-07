import { describe, expect, it } from "vitest";
import {
  BLOCK_THRESHOLD,
  buildCorpusIndex,
  charNgramSimilarity,
  checkTitle,
  containment,
  diceOverlap,
  levenshtein,
  levenshteinRatio,
  normalizeTitle,
  tokenize,
  verdictFor,
  WARN_THRESHOLD,
  type CorpusEntry,
} from "./similarity";

const corpus = (titles: string[]): CorpusEntry[] =>
  titles.map((title, i) => ({ id: `t${i}`, title }));

describe("normalisation", () => {
  it("drops the filler words the spec names", () => {
    // system, application, app, project, smart, automated, using, based
    expect(tokenize("Smart Attendance System")).toEqual(["attendance"]);
    expect(tokenize("Automated Grading Application")).toEqual(["grading"]);
    expect(tokenize("A Project Based on Sensors")).toEqual(["sensor"]);
  });

  it("expands abbreviations to their long form", () => {
    expect(normalizeTitle("Study Planner using ML")).toBe(
      "study planner machine learning",
    );
    // "of" is a stopword, "things" singularises to "thing".
    expect(tokenize("IoT Monitor")).toEqual(["internet", "thing", "monitor"]);
  });

  it("does not corrupt a phrase that merely contains a synonym key", () => {
    // "machine learning" contains the substring "e learning"; a plain
    // substring replace turned it into "machinonline learning".
    expect(normalizeTitle("Machine Learning Pipeline")).toBe(
      "machine learning pipeline",
    );
    expect(normalizeTitle("Surface Identity Checks")).toBe(
      "surface identity check",
    );
    // The phrase synonym still fires when it really is a standalone phrase.
    expect(normalizeTitle("E Learning Portal")).toBe("online learning portal");
  });

  it("collapses Face ID and facial recognition onto face recognition", () => {
    expect(normalizeTitle("Campus Security using Face ID")).toBe(
      "campus security face recognition",
    );
    expect(normalizeTitle("Facial Recognition Attendance")).toBe(
      "face recognition attendance",
    );
  });

  it("strips plurals so sensor and sensors match", () => {
    expect(tokenize("Wireless Sensors")).toEqual(["wireless", "sensor"]);
    expect(tokenize("Wireless Sensor")).toEqual(["wireless", "sensor"]);
  });

  it("returns nothing for a title made entirely of filler", () => {
    expect(tokenize("A Smart Automated System Project")).toEqual([]);
  });
});

describe("lexical sub-signals", () => {
  const a = new Set(["face", "recognition", "attendance"]);
  const b = new Set(["face", "recognition", "campus", "security"]);

  it("computes Dice over token sets", () => {
    // 2*2 shared / (3 + 4)
    expect(diceOverlap(a, b)).toBeCloseTo(4 / 7, 6);
    expect(diceOverlap(a, a)).toBe(1);
    expect(diceOverlap(a, new Set())).toBe(0);
  });

  it("computes containment against the shorter title", () => {
    expect(containment(a, b)).toBeCloseTo(2 / 3, 6);
    expect(containment(new Set(["face"]), b)).toBe(1);
  });

  it("computes Levenshtein distance and its ratio", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("same", "same")).toBe(0);
    expect(levenshteinRatio("same", "same")).toBe(1);
    expect(levenshteinRatio("abc", "abd")).toBeCloseTo(2 / 3, 6);
  });

  it("computes character trigram overlap", () => {
    expect(charNgramSimilarity("face recognition", "face recognition")).toBe(1);
    expect(charNgramSimilarity("abcdef", "uvwxyz")).toBe(0);
    expect(
      charNgramSimilarity("face recognition", "face recogntion"),
    ).toBeGreaterThan(0.6);
  });
});

describe("thresholds", () => {
  it("maps scores onto the spec's three bands", () => {
    expect(verdictFor(1)).toBe("BLOCKED");
    expect(verdictFor(BLOCK_THRESHOLD)).toBe("BLOCKED");
    expect(verdictFor(0.949)).toBe("WARNING");
    expect(verdictFor(WARN_THRESHOLD)).toBe("WARNING");
    expect(verdictFor(0.799)).toBe("ALLOWED");
    expect(verdictFor(0)).toBe("ALLOWED");
  });
});

describe("checkTitle", () => {
  const REGISTERED = [
    "Smart Attendance via Face Recognition",
    "Campus Security using Face ID",
    "IoT-Based Energy Monitoring Dashboard",
    "Adaptive Study Planner using ML",
    "Crop Disease Detection using Deep Learning",
    "Blockchain-Based Academic Certificate Verification",
  ];
  const index = buildCorpusIndex(corpus(REGISTERED));

  it("blocks the project report's worked example", () => {
    // The report's own case: the resubmission differs only by the filler
    // words "Smart" and "via", so both reduce to the same three tokens.
    const report = checkTitle("Smart Attendance Face Recognition", index);

    expect(report.normalized).toBe("attendance face recognition");
    expect(report.score).toBe(1);
    expect(report.verdict).toBe("BLOCKED");
    expect(report.best?.title).toBe("Smart Attendance via Face Recognition");
  });

  it("blocks a reordering of the same words", () => {
    const report = checkTitle("Face Recognition Attendance", index);
    expect(report.verdict).toBe("BLOCKED");
    expect(report.score).toBe(1);
  });

  it("blocks an exact resubmission", () => {
    const report = checkTitle("IoT-Based Energy Monitoring Dashboard", index);
    expect(report.verdict).toBe("BLOCKED");
  });

  it("allows a genuinely different title", () => {
    const report = checkTitle(
      "Federated Learning for Privacy-Preserving Health Records",
      index,
    );
    expect(report.verdict).toBe("ALLOWED");
    expect(report.score).toBeLessThan(WARN_THRESHOLD);
  });

  it("scores a partial overlap below the block threshold", () => {
    // Shares "face recognition" with two entries but adds distinct terms, so
    // it must not be blocked outright.
    const report = checkTitle("Face Recognition for Library Access", index);
    expect(report.verdict).not.toBe("BLOCKED");
    expect(report.score).toBeGreaterThan(0);
  });

  it("explains itself with per-signal values and shared terms", () => {
    const report = checkTitle("Attendance using Face Recognition", index);
    const best = report.best;

    expect(best).not.toBeNull();
    expect(best!.sharedTerms.sort()).toEqual([
      "attendance",
      "face",
      "recognition",
    ]);
    for (const signal of Object.values(best!.signals)) {
      expect(signal).toBeGreaterThanOrEqual(0);
      expect(signal).toBeLessThanOrEqual(1);
    }
  });

  it("returns at most five matches, highest first", () => {
    const report = checkTitle("Face Recognition Energy Study Planner", index);
    expect(report.matches.length).toBeLessThanOrEqual(5);
    const scores = report.matches.map((m) => m.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("skips the candidate's own stored row", () => {
    const own = index.docs[0].entry.id;
    const report = checkTitle("Smart Attendance via Face Recognition", index, {
      excludeId: own,
    });
    expect(report.best?.id).not.toBe(own);
    expect(report.verdict).not.toBe("BLOCKED");
  });

  it("scores nothing when the title is all filler", () => {
    const report = checkTitle("A Smart Automated System Project", index);
    expect(report.tokens).toEqual([]);
    expect(report.score).toBe(0);
    expect(report.matches).toEqual([]);
  });

  it("handles an empty corpus without dividing by zero", () => {
    const report = checkTitle("Anything At All", buildCorpusIndex([]));
    expect(report.score).toBe(0);
    expect(report.verdict).toBe("ALLOWED");
    expect(report.corpusSize).toBe(0);
  });

  it("keeps every score inside 0..1", () => {
    for (const title of [...REGISTERED, "Totally Unrelated Widget Factory"]) {
      const report = checkTitle(title, index);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(1);
    }
  });

  it("treats an abbreviation and its expansion as the same title", () => {
    const withAbbrev = checkTitle("Adaptive Study Planner using ML", index);
    const withWords = checkTitle(
      "Adaptive Study Planner using Machine Learning",
      index,
    );
    expect(withAbbrev.score).toBe(withWords.score);
    expect(withAbbrev.verdict).toBe("BLOCKED");
  });
});
