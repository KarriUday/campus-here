/**
 * Gale-Shapley guide allocation.
 *
 * Pure: no database import, so it unit-tests without a connection and the
 * dry-run preview and the committed run provably execute the same code.
 *
 * Groups propose down their ranked preference list; each guide holds the best
 * proposals it has seen up to its capacity and releases the rest. The result
 * is stable — no group and guide would both rather be paired with each other
 * than with what they got — and it is proposer-optimal, meaning every group
 * receives the best guide it could obtain in *any* stable matching.
 */

export type UnallocatedReason =
  | "ALL_PREFERENCES_FULL"
  | "INVALID_PREFERENCES"
  | "NO_PREFERENCES"
  | "NOT_SUBMITTED";

export type AllocGroup = {
  id: string;
  code: string;
  avgCgpa: number;
  domainId: string | null;
  /** Epoch milliseconds; null sorts last. */
  prefsSubmittedAt: number | null;
  /** Faculty ids, most preferred first. */
  preferences: string[];
  submitted: boolean;
};

export type AllocFaculty = {
  id: string;
  capacity: number;
  domainIds: string[];
};

export type AllocationInput = {
  groups: AllocGroup[];
  faculty: AllocFaculty[];
  /** How many ranked preferences a complete list must contain. */
  prefCount: number;
  /**
   * Assignments an admin made by hand. They are never recomputed, and they
   * consume the guide's capacity before matching begins.
   */
  lockedAssignments?: Array<{ groupId: string; facultyId: string }>;
};

export type AllocationMatch = {
  groupId: string;
  facultyId: string;
  /** 1-based position in the group's preference list. */
  rank: number;
};

export type AllocationOutcome = {
  matches: AllocationMatch[];
  unallocated: Array<{ groupId: string; reason: UnallocatedReason }>;
  /** Guides left with free places once matching settled. */
  remainingCapacity: Array<{ facultyId: string; free: number }>;
  stats: {
    groupsConsidered: number;
    facultyConsidered: number;
    allocated: number;
    unallocated: number;
    locked: number;
    /** How many groups got their 1st choice, 2nd, and so on. */
    rankHistogram: Record<number, number>;
    proposals: number;
  };
};

/**
 * How a guide ranks two competing groups. Documented here because §11 asks for
 * the tie-break to be an explicit, defensible choice rather than an accident:
 *
 *   1. a group whose domain the guide teaches outranks one it does not
 *   2. higher group average CGPA
 *   3. earlier preference submission — rewards groups that organised sooner
 *   4. group code ascending — a deterministic final tiebreak so a re-run of
 *      identical input always produces an identical matching
 *
 * Returns a negative number when `a` is the better proposal.
 */
export function compareProposals(
  guide: AllocFaculty,
  a: AllocGroup,
  b: AllocGroup,
): number {
  const domainMatch = (group: AllocGroup) =>
    group.domainId !== null && guide.domainIds.includes(group.domainId) ? 1 : 0;

  const byDomain = domainMatch(b) - domainMatch(a);
  if (byDomain !== 0) return byDomain;

  if (a.avgCgpa !== b.avgCgpa) return b.avgCgpa - a.avgCgpa;

  const aTime = a.prefsSubmittedAt ?? Number.POSITIVE_INFINITY;
  const bTime = b.prefsSubmittedAt ?? Number.POSITIVE_INFINITY;
  if (aTime !== bTime) return aTime - bTime;

  return a.code.localeCompare(b.code);
}

/** Reject a group before matching if its preference list is unusable. */
function disqualify(
  group: AllocGroup,
  prefCount: number,
  knownFaculty: Set<string>,
): UnallocatedReason | null {
  if (!group.submitted) return "NOT_SUBMITTED";
  if (group.preferences.length === 0) return "NO_PREFERENCES";

  const unique = new Set(group.preferences);
  if (unique.size !== group.preferences.length) return "INVALID_PREFERENCES";
  if (group.preferences.length !== prefCount) return "INVALID_PREFERENCES";
  if (group.preferences.some((id) => !knownFaculty.has(id))) {
    return "INVALID_PREFERENCES";
  }
  return null;
}

export function allocate(input: AllocationInput): AllocationOutcome {
  const { groups, faculty, prefCount } = input;
  const locked = input.lockedAssignments ?? [];

  const facultyById = new Map(faculty.map((f) => [f.id, f]));
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const knownFaculty = new Set(facultyById.keys());

  // Capacity remaining after honouring manual assignments.
  const capacity = new Map(faculty.map((f) => [f.id, f.capacity]));
  const lockedGroupIds = new Set<string>();
  for (const assignment of locked) {
    lockedGroupIds.add(assignment.groupId);
    const left = capacity.get(assignment.facultyId);
    if (left !== undefined) {
      capacity.set(assignment.facultyId, Math.max(0, left - 1));
    }
  }

  const unallocated: Array<{ groupId: string; reason: UnallocatedReason }> = [];
  const eligible: AllocGroup[] = [];

  for (const group of groups) {
    if (lockedGroupIds.has(group.id)) continue;
    const reason = disqualify(group, prefCount, knownFaculty);
    if (reason) unallocated.push({ groupId: group.id, reason });
    else eligible.push(group);
  }

  // Deterministic proposal order. Gale-Shapley converges to the same stable
  // matching regardless of order, but a fixed order keeps run logs
  // reproducible and makes the algorithm easy to trace by hand.
  const queue = [...eligible].sort((a, b) => a.code.localeCompare(b.code));
  const nextChoice = new Map<string, number>(eligible.map((g) => [g.id, 0]));
  const held = new Map<string, string[]>(faculty.map((f) => [f.id, []]));

  let proposals = 0;

  while (queue.length > 0) {
    const group = queue.shift()!;
    const index = nextChoice.get(group.id)!;

    if (index >= group.preferences.length) {
      unallocated.push({ groupId: group.id, reason: "ALL_PREFERENCES_FULL" });
      continue;
    }

    const facultyId = group.preferences[index];
    nextChoice.set(group.id, index + 1);
    proposals += 1;

    const guide = facultyById.get(facultyId)!;
    const shortlist = held.get(facultyId)!;
    shortlist.push(group.id);

    // Best proposals first, then drop whoever no longer fits.
    shortlist.sort((x, y) =>
      compareProposals(guide, groupById.get(x)!, groupById.get(y)!),
    );

    const limit = capacity.get(facultyId) ?? 0;
    while (shortlist.length > limit) {
      const displaced = shortlist.pop()!;
      // A displaced group re-enters the queue and continues down its list.
      queue.push(groupById.get(displaced)!);
    }
  }

  const matches: AllocationMatch[] = [];
  const rankHistogram: Record<number, number> = {};

  for (const [facultyId, groupIds] of held) {
    for (const groupId of groupIds) {
      const group = groupById.get(groupId)!;
      const rank = group.preferences.indexOf(facultyId) + 1;
      matches.push({ groupId, facultyId, rank });
      rankHistogram[rank] = (rankHistogram[rank] ?? 0) + 1;
    }
  }

  matches.sort((a, b) =>
    groupById.get(a.groupId)!.code.localeCompare(groupById.get(b.groupId)!.code),
  );
  unallocated.sort((a, b) =>
    groupById.get(a.groupId)!.code.localeCompare(groupById.get(b.groupId)!.code),
  );

  const remainingCapacity = faculty.map((f) => ({
    facultyId: f.id,
    free: Math.max(0, (capacity.get(f.id) ?? 0) - (held.get(f.id)?.length ?? 0)),
  }));

  return {
    matches,
    unallocated,
    remainingCapacity,
    stats: {
      groupsConsidered: groups.length,
      facultyConsidered: faculty.length,
      allocated: matches.length,
      unallocated: unallocated.length,
      locked: lockedGroupIds.size,
      rankHistogram,
      proposals,
    },
  };
}

/**
 * Verify a matching is stable: no (group, guide) pair would both prefer each
 * other over their current assignment. Used by the tests and available to the
 * API so a committed run can assert its own correctness.
 *
 * Stability is only defined over the groups that actually entered the market.
 * A group with an unusable preference list, or one an admin pinned by hand,
 * was never a participant, so it cannot form a blocking pair.
 */
export function findBlockingPair(
  input: AllocationInput,
  matches: AllocationMatch[],
): { groupId: string; facultyId: string } | null {
  const facultyById = new Map(input.faculty.map((f) => [f.id, f]));
  const groupById = new Map(input.groups.map((g) => [g.id, g]));
  const assignedFacultyOf = new Map(matches.map((m) => [m.groupId, m.facultyId]));
  const knownFaculty = new Set(facultyById.keys());
  const lockedGroupIds = new Set(
    (input.lockedAssignments ?? []).map((a) => a.groupId),
  );

  const holdersOf = new Map<string, string[]>();
  for (const match of matches) {
    const list = holdersOf.get(match.facultyId) ?? [];
    list.push(match.groupId);
    holdersOf.set(match.facultyId, list);
  }

  for (const group of input.groups) {
    if (lockedGroupIds.has(group.id)) continue;
    if (disqualify(group, input.prefCount, knownFaculty)) continue;

    const current = assignedFacultyOf.get(group.id);
    const currentRank = current
      ? group.preferences.indexOf(current)
      : Number.POSITIVE_INFINITY;

    // Every guide this group would rather have than its current assignment.
    for (let rank = 0; rank < group.preferences.length && rank < currentRank; rank++) {
      const facultyId = group.preferences[rank];
      const guide = facultyById.get(facultyId);
      if (!guide) continue;

      const holders = holdersOf.get(facultyId) ?? [];
      if (holders.length < guide.capacity) {
        // The guide has a free place and the group prefers them: unstable.
        return { groupId: group.id, facultyId };
      }
      // Or the guide would rather have this group than its weakest holder.
      const weakest = holders.reduce((worst, id) =>
        compareProposals(guide, groupById.get(id)!, groupById.get(worst)!) > 0
          ? id
          : worst,
      );
      if (compareProposals(guide, group, groupById.get(weakest)!) < 0) {
        return { groupId: group.id, facultyId };
      }
    }
  }

  return null;
}
