import { describe, expect, it } from "vitest";
import {
  averageCgpa,
  cn,
  formatCgpa,
  normalizeEmail,
  normalizeUsn,
} from "./utils";

describe("cn", () => {
  it("lets the later conflicting Tailwind utility win", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("rounded-xl", false && "hidden", undefined, "border")).toBe(
      "rounded-xl border",
    );
  });
});

describe("formatCgpa", () => {
  it("always renders two decimals", () => {
    expect(formatCgpa(9)).toBe("9.00");
    expect(formatCgpa("8.5")).toBe("8.50");
  });

  it("renders an em dash for missing values", () => {
    expect(formatCgpa(null)).toBe("—");
    expect(formatCgpa(undefined)).toBe("—");
    expect(formatCgpa("")).toBe("—");
  });
});

describe("averageCgpa", () => {
  // The prototype printed "9.12" as a hardcoded string for these four members;
  // this asserts the real arithmetic lands on the same number.
  it("averages the prototype's CSE6-A-014 roster to 9.12", () => {
    expect(averageCgpa([9.36, 9.18, 8.9, 9.04])).toBe(9.12);
  });

  it("returns 0 for an empty group rather than NaN", () => {
    expect(averageCgpa([])).toBe(0);
  });

  it("ignores non-numeric entries", () => {
    expect(averageCgpa([8, "9", "not-a-number"])).toBe(8.5);
  });
});

describe("normalizers", () => {
  it("uppercases and trims a USN", () => {
    expect(normalizeUsn("  1by23cs098 ")).toBe("1BY23CS098");
  });

  it("lowercases and trims an email", () => {
    expect(normalizeEmail("  Uday.K@Example.EDU ")).toBe("uday.k@example.edu");
  });
});
