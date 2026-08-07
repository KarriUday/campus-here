import { describe, expect, it } from "vitest";
import {
  parseTitleImport,
  validateFacultyRows,
  validateStudentRows,
  type ExistingStudentIndex,
} from "./csv";

const emptyIndex = (): ExistingStudentIndex => ({
  enrolledUsns: new Set(),
  knownUsns: new Set(),
  emailOwners: new Map(),
});

const HEADER = "usn,name,cgpa,phone,email";
const row = (usn: string, name: string, cgpa: string, email: string, phone = "") =>
  `${usn},${name},${cgpa},${phone},${email}`;

describe("validateStudentRows", () => {
  it("accepts a well-formed file", () => {
    const result = validateStudentRows(
      [
        HEADER,
        row("1BY23CS001", "Aarav Rao", "8.75", "aarav@example.edu", "9000000001"),
        row("1BY23CS002", "Meera Shetty", "9.1", "meera@example.edu"),
      ].join("\n"),
      emptyIndex(),
    );

    expect(result.issues).toEqual([]);
    expect(result.totalRows).toBe(2);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      usn: "1BY23CS001",
      fullName: "Aarav Rao",
      email: "aarav@example.edu",
      cgpa: 8.75,
      phone: "9000000001",
    });
    // Phone is optional and normalises to null, not "".
    expect(result.valid[1].phone).toBeNull();
  });

  it("normalises USN to uppercase and email to lowercase", () => {
    const result = validateStudentRows(
      [HEADER, row(" 1by23cs003 ", "Kiran N", "7.5", "  Kiran.N@Example.EDU ")].join("\n"),
      emptyIndex(),
    );
    expect(result.valid[0].usn).toBe("1BY23CS003");
    expect(result.valid[0].email).toBe("kiran.n@example.edu");
  });

  it("accepts full_name as an alias for name", () => {
    const result = validateStudentRows(
      ["usn,full_name,cgpa,email", "1BY23CS004,Divya Pai,8.0,divya@example.edu"].join("\n"),
      emptyIndex(),
    );
    expect(result.issues).toEqual([]);
    expect(result.valid[0].fullName).toBe("Divya Pai");
  });

  it("reports the prototype's exact per-row messages", () => {
    const result = validateStudentRows(
      [
        HEADER,
        row("", "No USN", "8", "a@example.edu"),
        row("1BY23CS011", "", "8", "b@example.edu"),
        row("1BY23CS012", "Bad CGPA", "11.5", "c@example.edu"),
        row("1BY23CS013", "Not A Number", "abc", "d@example.edu"),
        row("1BY23CS014", "No At Sign", "8", "not-an-email"),
      ].join("\n"),
      emptyIndex(),
    );

    expect(result.issues.map((i) => i.message)).toEqual([
      "USN is required.",
      "Name is required.",
      "CGPA must be a number between 0 and 10.",
      "CGPA must be a number between 0 and 10.",
      "Valid email is required.",
    ]);
    expect(result.valid).toHaveLength(0);
  });

  it("accepts the CGPA boundaries 0 and 10", () => {
    const result = validateStudentRows(
      [
        HEADER,
        row("1BY23CS015", "Floor", "0", "floor@example.edu"),
        row("1BY23CS016", "Ceiling", "10", "ceiling@example.edu"),
      ].join("\n"),
      emptyIndex(),
    );
    expect(result.issues).toEqual([]);
    expect(result.valid).toHaveLength(2);
  });

  it("catches duplicates inside one file", () => {
    const result = validateStudentRows(
      [
        HEADER,
        row("1BY23CS020", "First", "8", "first@example.edu"),
        row("1BY23CS020", "Same USN", "8", "other@example.edu"),
        row("1BY23CS021", "Same Email", "8", "first@example.edu"),
      ].join("\n"),
      emptyIndex(),
    );
    expect(result.issues.map((i) => i.message)).toEqual([
      "Duplicate USN.",
      "Duplicate email.",
    ]);
    expect(result.valid).toHaveLength(1);
  });

  it("rejects a USN already enrolled in the cycle", () => {
    const index = emptyIndex();
    index.enrolledUsns.add("1BY23CS030");
    index.knownUsns.add("1BY23CS030");

    const result = validateStudentRows(
      [HEADER, row("1BY23CS030", "Already Here", "8", "again@example.edu")].join("\n"),
      index,
    );
    expect(result.issues[0].message).toBe("Duplicate USN.");
  });

  it("enrols a student who exists but is not in this cycle", () => {
    // A person doing both a Major and a Mini project keeps one account; the
    // upload should enrol them rather than reject them as a duplicate.
    const index = emptyIndex();
    index.knownUsns.add("1BY23CS031");
    index.emailOwners.set("carry@example.edu", "1BY23CS031");

    const result = validateStudentRows(
      [HEADER, row("1BY23CS031", "Carry Over", "8", "carry@example.edu")].join("\n"),
      index,
    );
    expect(result.issues).toEqual([]);
    expect(result.valid[0].existing).toBe(true);
  });

  it("rejects an address already owned by a different USN", () => {
    const index = emptyIndex();
    index.emailOwners.set("shared@example.edu", "1BY23CS040");

    const result = validateStudentRows(
      [HEADER, row("1BY23CS041", "Impostor", "8", "shared@example.edu")].join("\n"),
      index,
    );
    expect(result.issues[0].message).toBe("Duplicate email.");
  });

  it("reports every missing required column at once", () => {
    const result = validateStudentRows(
      ["usn,cgpa", "1BY23CS050,8"].join("\n"),
      emptyIndex(),
    );
    expect(result.issues[0].message).toBe(
      "Missing required columns: name (or full_name), email",
    );
  });

  it("reports an empty file", () => {
    expect(validateStudentRows("", emptyIndex()).issues[0].message).toBe(
      "CSV is empty.",
    );
    expect(validateStudentRows(HEADER, emptyIndex()).issues[0].message).toBe(
      "CSV is empty.",
    );
  });

  it("handles quoted fields containing commas", () => {
    const result = validateStudentRows(
      [HEADER, `1BY23CS060,"Rao, Aarav",8.5,,quoted@example.edu`].join("\n"),
      emptyIndex(),
    );
    expect(result.issues).toEqual([]);
    expect(result.valid[0].fullName).toBe("Rao, Aarav");
  });

  it("numbers rows as they appear in a spreadsheet", () => {
    const result = validateStudentRows(
      [HEADER, row("1BY23CS070", "Fine", "8", "fine@example.edu"), row("", "Broken", "8", "x@example.edu")].join("\n"),
      emptyIndex(),
    );
    // Header is line 1, first data row is line 2, so the bad row is line 3.
    expect(result.issues[0].rowNumber).toBe(3);
  });
});

describe("validateFacultyRows", () => {
  const HEAD = "name,email,designation,domains,capacity,phone";

  it("parses designations and semicolon-separated domains", () => {
    const result = validateFacultyRows(
      [
        HEAD,
        "Dr. A Guide,a@example.edu,Associate Professor,AI/ML;Data Science,2,9800000001",
        "Prof. B Guide,b@example.edu,professor,Web,3,",
        "Ms. C Guide,c@example.edu,Asst. Professor,IoT,,",
      ].join("\n"),
      new Set(),
    );

    expect(result.issues).toEqual([]);
    expect(result.valid[0]).toMatchObject({
      fullName: "Dr. A Guide",
      designation: "ASSOCIATE_PROFESSOR",
      domains: ["AI/ML", "Data Science"],
      capacity: 2,
    });
    expect(result.valid[1].designation).toBe("PROFESSOR");
    expect(result.valid[1].capacity).toBe(3);
    // Capacity is optional and defaults to the departmental cap of 2.
    expect(result.valid[2].designation).toBe("ASSISTANT_PROFESSOR");
    expect(result.valid[2].capacity).toBe(2);
  });

  it("rejects an unrecognised designation", () => {
    const result = validateFacultyRows(
      [HEAD, "Dr. X,x@example.edu,Reader,AI/ML,2,"].join("\n"),
      new Set(),
    );
    expect(result.issues[0].message).toBe(
      "Designation must be Assistant Professor, Associate Professor, or Professor.",
    );
  });

  it("rejects an out-of-range or fractional capacity", () => {
    const result = validateFacultyRows(
      [
        HEAD,
        "Dr. Y,y@example.edu,Professor,AI/ML,0,",
        "Dr. Z,z@example.edu,Professor,AI/ML,2.5,",
      ].join("\n"),
      new Set(),
    );
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].message).toBe(
      "Capacity must be a whole number between 1 and 10.",
    );
  });

  it("flags a guide who already exists so the import updates them", () => {
    const result = validateFacultyRows(
      [HEAD, "Dr. A Guide,a@example.edu,Professor,AI/ML,2,"].join("\n"),
      new Set(["a@example.edu"]),
    );
    expect(result.issues).toEqual([]);
    expect(result.valid[0].existing).toBe(true);
  });
});

describe("parseTitleImport", () => {
  it("reads one title per line when there is no header", () => {
    const result = parseTitleImport(
      ["Smart Attendance via Face Recognition", "IoT Energy Monitor", ""].join("\n"),
    );
    expect(result.issues).toEqual([]);
    expect(result.valid.map((t) => t.title)).toEqual([
      "Smart Attendance via Face Recognition",
      "IoT Energy Monitor",
    ]);
  });

  it("reads the documented CSV headers", () => {
    const result = parseTitleImport(
      [
        "title,group,domain,guide,cycle",
        "Smart Attendance via Face Recognition,CSE6-A-021,AI/ML,Dr. Ananya Rao,2024-25 Major",
      ].join("\n"),
    );
    expect(result.valid[0]).toEqual({
      title: "Smart Attendance via Face Recognition",
      groupLabel: "CSE6-A-021",
      domainLabel: "AI/ML",
      guideLabel: "Dr. Ananya Rao",
      cycleLabel: "2024-25 Major",
    });
  });

  it("accepts the spec's header aliases", () => {
    // §3.4: "project title" / "final title" / "group code" / "faculty" / "mentor"
    const result = parseTitleImport(
      [
        "final title,group code,domain,mentor,batch",
        "Adaptive Study Planner using ML,CSE6-A-014,AI/ML,Dr. Ananya Rao,2024-25",
      ].join("\n"),
    );
    expect(result.valid[0]).toMatchObject({
      title: "Adaptive Study Planner using ML",
      groupLabel: "CSE6-A-014",
      guideLabel: "Dr. Ananya Rao",
      cycleLabel: "2024-25",
    });
  });

  it("drops duplicates within one file", () => {
    const result = parseTitleImport(
      ["Same Title", "same title", "Different Title"].join("\n"),
    );
    expect(result.valid).toHaveLength(2);
    expect(result.issues[0].message).toBe("Duplicate title in this file.");
  });

  it("reports an empty payload", () => {
    expect(parseTitleImport("   ").issues[0].message).toBe("Nothing to import.");
  });
});
