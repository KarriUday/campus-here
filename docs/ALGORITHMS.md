# Algorithms

The two the academic report is actually about, worked through on real data.

---

## 1. Title originality — TF-IDF cosine with explainable sub-signals

`src/lib/`-style pure logic in `src/server/services/similarity.ts`.
Tests: `similarity.spec.ts` (23 cases).

### Pipeline

```
  "Smart Attendance via Face Recognition"
        │
        │ 1. clean: lowercase, strip punctuation, collapse whitespace
        ▼  "smart attendance via face recognition"
        │
        │ 2. expand multi-word synonyms (word-boundary anchored)
        ▼  unchanged here; "Face ID" → "face recognition" elsewhere
        │
        │ 3. expand abbreviations token by token
        ▼  ML → machine learning, IoT → internet of things, …
        │
        │ 4. drop stopwords and academic filler
        ▼  smart, via  ✂
        │
        │ 5. strip plurals
        ▼
     ["attendance", "face", "recognition"]
```

**The stopword list is deliberately conservative.** It drops the words §3.4
names — `system, application, app, project, smart, automated, using, based` —
plus ordinary function words and unambiguous filler like `novel`, `efficient`,
`framework`. It does **not** drop `design`, `model`, `study`, `platform` or
`tool`, because those carry meaning in real titles: *VLSI Design*, *Language
Model*. Dropping them would collide genuinely different projects.

**Synonym phrases match on word boundaries, not substrings.** This is not
pedantry: `"machine learning"` contains the substring `"e learning"`, and a
naive `split/join` rewrote it to `"machinonline learning"`. A test caught it.

### Scoring

TF-IDF cosine is the primary signal, weighted **0.65**. IDF is smoothed
`log((N+1)/(df+1)) + 1` over the cycle's corpus, term frequency is the raw
count, and vectors are L2-normalised so title length drops out.

The highest of four lexical signals contributes the remaining **0.35**:

| Signal | What it catches |
|---|---|
| Dice overlap | shared vocabulary, length-balanced |
| Containment | a short title wholly inside a longer one |
| Character 3-gram Jaccard | typos and transpositions |
| Levenshtein ratio | small edits to an existing title |

```
score = 0.65·tfidf + 0.35·max(dice, containment, ngram, levenshtein)
```

**Override:** when two titles reduce to the *same token set*, the score is
forced to `1.00` regardless of the weighted sum. Same words in any order is the
same project.

Why blend at all: cosine alone under-reads a near-duplicate whose shared words
are common across the corpus (their IDF is low, so the vectors barely align);
edit distance alone over-reads two unrelated titles that merely have a similar
shape. Each covers the other's blind spot.

### Bands (spec §3.4)

| Score | Verdict | Effect |
|---|---|---|
| ≥ 0.95 | **BLOCKED** | the save endpoint returns 409; the Save button is disabled |
| 0.80 – 0.94 | **WARNING** | saving is allowed, and the guide sees the score |
| < 0.80 | **ALLOWED** | no flag |

### Worked example — the report's own case

Candidate: **"Smart Attendance Face Recognition"**
Corpus entry: **"Smart Attendance via Face Recognition"**

```
candidate  → smart ✂  attendance  face  recognition          (via not present)
corpus     → smart ✂  attendance  via ✂  face  recognition

both token sets = {attendance, face, recognition}   → identical
                                                     → score 1.00 → BLOCKED
```

Verified live against the seeded 70-title corpus: `100% BLOCKED`, best match
*"Smart Attendance via Face Recognition"*, with every sub-signal at 1.00 and
shared terms `attendance, face, recognition`.

### A second worked example — the abbreviation case

Candidate: **"Adaptive Study Planner using Machine Learning"**
Corpus entry: **"Adaptive Study Planner using ML"**

```
candidate → adaptive study planner machine learning       ("using" dropped)
corpus    → adaptive study planner machine learning       (ML expanded)
                                              → identical → 1.00 → BLOCKED
```

This is the case that exposed the `"e learning"` substring bug.

### A near-miss that must *not* block

Candidate: **"Face Recognition for Library Access"** against the same corpus
scores **58% — ALLOWED**. It shares `face` and `recognition` with two entries
but adds distinct terms, and neither token set matches.

---

## 2. Guide allocation — Gale-Shapley stable matching

Pure engine in `src/lib/allocation-engine.ts`.
Tests: `allocation-engine.spec.ts` (18 cases, including a 75-group cohort).

### The market

- **Proposers:** groups that have submitted, each with six ranked guides.
- **Receivers:** guides, each with a capacity (default 2 per cycle).
- Manual assignments are removed from the market entirely and their capacity is
  spent before matching begins.

### The loop

```
queue ← eligible groups, ordered by code
while queue is not empty:
    g ← queue.shift()
    if g has exhausted its six preferences:
        mark ALL_PREFERENCES_FULL;  continue
    f ← g's next preferred guide
    add g to f's shortlist
    sort f's shortlist by f's ranking
    while shortlist longer than f's capacity:
        displaced ← shortlist.pop()      # the weakest proposal
        queue.push(displaced)            # it continues down its own list
```

### How a guide ranks two competing groups

This is the tie-break §11 asks to be an explicit, documented choice:

1. **Domain match** — a group whose domain the guide teaches outranks one it
   does not, even at a much lower CGPA.
2. **Higher group average CGPA.**
3. **Earlier preference submission** — rewards groups that organised sooner.
4. **Group code ascending** — a deterministic final tiebreak, so re-running
   identical data always produces an identical matching.

### Properties

- **Stable.** No group and guide would both rather be paired with each other
  than with what they got. `findBlockingPair()` verifies this, and
  `runAllocation()` refuses to write a matching that fails its own check.
- **Proposer-optimal.** Every group gets the best guide it could obtain in
  *any* stable matching.
- **Order-independent.** The result is the same whatever order proposals are
  processed in; the fixed queue order only makes run logs reproducible.

Stability is only defined over the groups that entered the market. A group with
an unusable preference list, or one an admin pinned by hand, was never a
participant and cannot form a blocking pair — a test-caught scoping bug in the
first version of `findBlockingPair()`.

### Unallocated reasons

| Reason | Meaning |
|---|---|
| `ALL_PREFERENCES_FULL` | proposed to all six; every one was at capacity |
| `INVALID_PREFERENCES` | not exactly six, repeated, or an unknown guide |
| `NO_PREFERENCES` | none submitted |
| `NOT_SUBMITTED` | the group never submitted |

### Worked run on the seeded cohort

55 submitted groups, 40 guides at capacity 2 (80 places):

```
  groups considered   55
  guides considered   40
  proposals made      74        (only 19 more than the 55 first choices)
  allocated           55
  unallocated          0
  choice satisfied    #1 → 43   #2 → 6   #3 → 5   #4 → 1
  stable              yes (no blocking pair)
```

**78% of groups received their first choice.** Re-running produced a
byte-identical matching.

Squeezing every guide to capacity 1 through Settings — 40 places for 55 groups
— produced the expected scarcity:

```
  allocated           39
  unallocated         16        all ALL_PREFERENCES_FULL
```

A manual assignment then survived two further runs and was reported as
`locked: 1`, and assigning to a guide already at capacity was refused.

---

## 3. Calendar date and phase detection

`src/lib/calendar-parse.ts`. Tests: `calendar-parse.spec.ts` (19 cases).

Three passes, ported from the prototype:

1. **Line by line** — a line that looks like a review milestone and parses to a
   date. An explicit phase marker earns `HIGH` confidence.
2. **Whole-blob regex** — for calendars that extract as one long line;
   `MEDIUM`.
3. **Sentence chunks** — only if the first two found nothing; `LOW`.

Six date shapes are accepted, ranges resolving to their first day:
`04-05 October 2026`, `12 September 2026`, `12/09/2026`, `2026-09-12`,
`September 12, 2026`, and any of these without a year.

**A bug inherited from the prototype:** its R0 pattern `review[-\s]*0` matched
the `0` inside `"review - 04-05 October"`, so a Phase-1 line was read as R0 and
every phase in the calendar shifted by one. Anchoring the digit on a word
boundary fixes it.

**A conservatism check that matters.** Run against the department's real
*CSE VI & VII Semester Project Diary* — 678 KB, 20,743 characters of extracted
text containing "Review 1", "Review 2", "Phase I" and "30 Marks" — the detector
returned **zero** events, correctly, because that document is a rubrics
template with no calendar dates in it. It did not invent a date from "30 Mar".
