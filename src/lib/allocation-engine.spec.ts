import { describe, expect, it } from "vitest";
import {
  allocate,
  compareProposals,
  findBlockingPair,
  type AllocFaculty,
  type AllocGroup,
  type AllocationInput,
} from "./allocation-engine";

const group = (
  code: string,
  preferences: string[],
  overrides: Partial<AllocGroup> = {},
): AllocGroup => ({
  id: code,
  code,
  avgCgpa: 8,
  domainId: null,
  prefsSubmittedAt: 1000,
  preferences,
  submitted: true,
  ...overrides,
});

const guide = (
  id: string,
  capacity = 2,
  domainIds: string[] = [],
): AllocFaculty => ({ id, capacity, domainIds });

describe("compareProposals", () => {
  it("prefers a group whose domain the guide teaches", () => {
    const g = guide("f1", 2, ["ai"]);
    const match = group("A", [], { domainId: "ai", avgCgpa: 6 });
    const other = group("B", [], { domainId: "web", avgCgpa: 9.9 });
    // Domain outranks CGPA, even a much higher one.
    expect(compareProposals(g, match, other)).toBeLessThan(0);
  });

  it("falls back to higher average CGPA", () => {
    const g = guide("f1");
    expect(
      compareProposals(g, group("A", [], { avgCgpa: 9 }), group("B", [], { avgCgpa: 8 })),
    ).toBeLessThan(0);
  });

  it("then to the earlier submission", () => {
    const g = guide("f1");
    const early = group("A", [], { prefsSubmittedAt: 100 });
    const late = group("B", [], { prefsSubmittedAt: 900 });
    expect(compareProposals(g, early, late)).toBeLessThan(0);
  });

  it("treats a group that never submitted as latest", () => {
    const g = guide("f1");
    const dated = group("A", [], { prefsSubmittedAt: 5 });
    const undated = group("B", [], { prefsSubmittedAt: null });
    expect(compareProposals(g, dated, undated)).toBeLessThan(0);
  });

  it("breaks a total tie on group code, so runs are reproducible", () => {
    const g = guide("f1");
    expect(compareProposals(g, group("CSE-001", []), group("CSE-002", []))).toBeLessThan(0);
  });
});

describe("allocate", () => {
  it("gives everyone their first choice when there is room", () => {
    const input: AllocationInput = {
      prefCount: 2,
      faculty: [guide("f1"), guide("f2")],
      groups: [group("A", ["f1", "f2"]), group("B", ["f2", "f1"])],
    };
    const result = allocate(input);

    expect(result.matches).toEqual([
      { groupId: "A", facultyId: "f1", rank: 1 },
      { groupId: "B", facultyId: "f2", rank: 1 },
    ]);
    expect(result.unallocated).toEqual([]);
    expect(result.stats.rankHistogram).toEqual({ 1: 2 });
  });

  it("never exceeds a guide's capacity", () => {
    const input: AllocationInput = {
      prefCount: 2,
      faculty: [guide("f1", 2), guide("f2", 2)],
      groups: [
        group("A", ["f1", "f2"], { avgCgpa: 9 }),
        group("B", ["f1", "f2"], { avgCgpa: 8 }),
        group("C", ["f1", "f2"], { avgCgpa: 7 }),
        group("D", ["f1", "f2"], { avgCgpa: 6 }),
      ],
    };
    const result = allocate(input);

    const perGuide = new Map<string, number>();
    for (const m of result.matches) {
      perGuide.set(m.facultyId, (perGuide.get(m.facultyId) ?? 0) + 1);
    }
    expect(perGuide.get("f1")).toBe(2);
    expect(perGuide.get("f2")).toBe(2);
    expect(result.matches).toHaveLength(4);
  });

  it("gives the contested guide to the stronger groups", () => {
    const input: AllocationInput = {
      prefCount: 2,
      faculty: [guide("f1", 1), guide("f2", 1)],
      groups: [
        group("A", ["f1", "f2"], { avgCgpa: 7 }),
        group("B", ["f1", "f2"], { avgCgpa: 9 }),
      ],
    };
    const result = allocate(input);
    // B outranks A on CGPA, so B keeps f1 and A is displaced to f2.
    expect(result.matches).toContainEqual({ groupId: "B", facultyId: "f1", rank: 1 });
    expect(result.matches).toContainEqual({ groupId: "A", facultyId: "f2", rank: 2 });
  });

  it("flags a group whose every preference is full", () => {
    const input: AllocationInput = {
      prefCount: 1,
      faculty: [guide("f1", 1)],
      groups: [
        group("A", ["f1"], { avgCgpa: 9 }),
        group("B", ["f1"], { avgCgpa: 8 }),
      ],
    };
    const result = allocate(input);

    expect(result.matches).toEqual([{ groupId: "A", facultyId: "f1", rank: 1 }]);
    expect(result.unallocated).toEqual([
      { groupId: "B", reason: "ALL_PREFERENCES_FULL" },
    ]);
  });

  it("rejects unusable preference lists before matching", () => {
    const input: AllocationInput = {
      prefCount: 2,
      faculty: [guide("f1"), guide("f2")],
      groups: [
        group("A", []),
        group("B", ["f1"]), // too short
        group("C", ["f1", "f1"]), // repeated guide
        group("D", ["f1", "ghost"]), // unknown guide
        group("E", ["f1", "f2"], { submitted: false }),
      ],
    };
    const result = allocate(input);

    expect(result.matches).toEqual([]);
    expect(result.unallocated).toEqual([
      { groupId: "A", reason: "NO_PREFERENCES" },
      { groupId: "B", reason: "INVALID_PREFERENCES" },
      { groupId: "C", reason: "INVALID_PREFERENCES" },
      { groupId: "D", reason: "INVALID_PREFERENCES" },
      { groupId: "E", reason: "NOT_SUBMITTED" },
    ]);
  });

  it("honours manual assignments and charges them to capacity", () => {
    const input: AllocationInput = {
      prefCount: 1,
      faculty: [guide("f1", 1)],
      groups: [group("A", ["f1"]), group("B", ["f1"])],
      lockedAssignments: [{ groupId: "A", facultyId: "f1" }],
    };
    const result = allocate(input);

    // A is not rematched, and f1's only place is already spent, so B cannot fit.
    expect(result.matches).toEqual([]);
    expect(result.unallocated).toEqual([
      { groupId: "B", reason: "ALL_PREFERENCES_FULL" },
    ]);
    expect(result.stats.locked).toBe(1);
  });

  it("produces a stable matching with no blocking pair", () => {
    const input: AllocationInput = {
      prefCount: 3,
      faculty: [
        guide("f1", 2, ["ai"]),
        guide("f2", 1, ["web"]),
        guide("f3", 2, ["ai"]),
      ],
      groups: [
        group("A", ["f1", "f2", "f3"], { avgCgpa: 9.1, domainId: "ai" }),
        group("B", ["f1", "f3", "f2"], { avgCgpa: 8.4, domainId: "web" }),
        group("C", ["f2", "f1", "f3"], { avgCgpa: 8.9, domainId: "ai" }),
        group("D", ["f1", "f2", "f3"], { avgCgpa: 7.2, domainId: "ai" }),
        group("E", ["f3", "f1", "f2"], { avgCgpa: 9.5, domainId: "web" }),
      ],
    };
    const result = allocate(input);
    expect(findBlockingPair(input, result.matches)).toBeNull();
  });

  it("is deterministic across repeated runs and input orderings", () => {
    const faculty = [guide("f1", 2, ["ai"]), guide("f2", 2), guide("f3", 1)];
    const groups = [
      group("A", ["f1", "f2", "f3"], { avgCgpa: 8.5, domainId: "ai" }),
      group("B", ["f1", "f3", "f2"], { avgCgpa: 8.5, domainId: "ai" }),
      group("C", ["f2", "f1", "f3"], { avgCgpa: 8.5, domainId: "ai" }),
      group("D", ["f1", "f2", "f3"], { avgCgpa: 8.5, domainId: "ai" }),
    ];
    const base: AllocationInput = { prefCount: 3, faculty, groups };

    const first = allocate(base);
    const second = allocate(base);
    // Same input reshuffled must still land on the same matching.
    const shuffled = allocate({ ...base, groups: [...groups].reverse() });

    expect(second.matches).toEqual(first.matches);
    expect(shuffled.matches).toEqual(first.matches);
  });

  it("reports remaining capacity per guide", () => {
    const result = allocate({
      prefCount: 1,
      faculty: [guide("f1", 3), guide("f2", 2)],
      groups: [group("A", ["f1"]), group("B", ["f1"])],
    });
    expect(result.remainingCapacity).toEqual([
      { facultyId: "f1", free: 1 },
      { facultyId: "f2", free: 2 },
    ]);
  });

  it("handles an empty cohort", () => {
    const result = allocate({ prefCount: 6, faculty: [guide("f1")], groups: [] });
    expect(result.matches).toEqual([]);
    expect(result.unallocated).toEqual([]);
    expect(result.stats.allocated).toBe(0);
  });

  it("scales to a full cohort without leaving a blocking pair", () => {
    // 75 groups over 40 guides at capacity 2 — the real shape of the cohort.
    const faculty = Array.from({ length: 40 }, (_, i) =>
      guide(`f${i}`, 2, [i % 3 === 0 ? "ai" : "web"]),
    );
    const groups = Array.from({ length: 75 }, (_, i) => {
      // Everyone chases the same three popular guides first, then fills the
      // list with distinct others so every list is exactly 6 unique guides.
      const prefs = ["f0", "f1", "f2"];
      let step = 3;
      while (prefs.length < 6) {
        const candidate = `f${(3 + i * 7 + step * 11) % 40}`;
        if (!prefs.includes(candidate)) prefs.push(candidate);
        step += 1;
      }
      return group(`G${String(i).padStart(3, "0")}`, prefs, {
        avgCgpa: 6 + (i % 40) / 10,
        domainId: i % 2 === 0 ? "ai" : "web",
        prefsSubmittedAt: 1000 + i,
      });
    });
    const input: AllocationInput = { prefCount: 6, faculty, groups };
    const result = allocate(input);

    // Every list is complete, so nobody is disqualified before matching.
    expect(result.unallocated.every((u) => u.reason === "ALL_PREFERENCES_FULL")).toBe(
      true,
    );
    expect(findBlockingPair(input, result.matches)).toBeNull();
    for (const { facultyId, free } of result.remainingCapacity) {
      expect(free).toBeGreaterThanOrEqual(0);
      const held = result.matches.filter((m) => m.facultyId === facultyId).length;
      expect(held).toBeLessThanOrEqual(2);
    }
    expect(result.stats.allocated + result.stats.unallocated).toBe(75);
    // 40 guides x 2 places cannot seat 75 groups, so some must miss out.
    expect(result.stats.allocated).toBeLessThanOrEqual(80);
    expect(result.stats.allocated).toBeGreaterThan(60);
  });

  it("does not judge a disqualified group as a blocking pair", () => {
    // A group with a short list never entered the market, so a guide with a
    // free place beside it is not an instability.
    const input: AllocationInput = {
      prefCount: 2,
      faculty: [guide("f1", 2)],
      groups: [group("A", ["f1"]), group("B", ["f1", "f1"])],
    };
    const result = allocate(input);
    expect(result.matches).toEqual([]);
    expect(findBlockingPair(input, result.matches)).toBeNull();
  });
});
