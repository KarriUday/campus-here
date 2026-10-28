import exceljs from "exceljs";
import fs from "fs";
import path from "path";

export type ParsedStudent = {
  usn: string;
  name: string;
  personalEmail: string;
  phone: string;
  sourceFile: string;
};

export async function getStudentsFromExcel(): Promise<ParsedStudent[]> {
  const dataDir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".xlsx"));
  const studentsMap = new Map<string, ParsedStudent>();

  for (const f of files) {
    const wb = new exceljs.Workbook();
    await wb.xlsx.readFile(path.join(dataDir, f));

    for (const ws of wb.worksheets) {
      ws.eachRow((row) => {
        const rowVals: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell) => {
          let text = "";
          if (typeof cell.value === "string") {
            text = cell.value;
          } else if (cell.value && typeof cell.value === "object") {
            if ("richText" in cell.value && Array.isArray((cell.value as any).richText)) {
              text = (cell.value as any).richText.map((rt: any) => rt.text).join("");
            } else if ("text" in cell.value) {
              text = String((cell.value as any).text);
            } else {
              text = String(cell.text ?? "");
            }
          } else if (cell.value !== undefined && cell.value !== null) {
            text = String(cell.value);
          }
          text = text.trim();
          if (text) rowVals.push(text);
        });

        // Search for USN pattern: e.g. 1BY24CS003, 1TD24CS028, 1TE24CS025, etc.
        for (let i = 0; i < rowVals.length; i++) {
          const match = rowVals[i].match(/\b(1[A-Z0-9]{2}\d{2}[A-Z]{2}\d{3})\b/i);
          if (match) {
            const usn = match[1].toUpperCase();
            let name = "";
            let email = "";
            let phone = "";

            for (let j = 0; j < rowVals.length; j++) {
              if (j === i) continue;
              const val = rowVals[j];
              if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                email = val.toLowerCase();
              } else if (/^\+?\d{10,12}$/.test(val.replace(/[-\s]/g, ""))) {
                phone = val.replace(/[-\s]/g, "");
              } else if (
                val.length > 2 &&
                !name &&
                !/^\d+$/.test(val) &&
                !val.toLowerCase().includes("batch") &&
                !val.toLowerCase().includes("branch") &&
                !val.toLowerCase().includes("sem") &&
                !val.toLowerCase().includes("bms") &&
                !val.toLowerCase().includes("candidate") &&
                !val.toLowerCase().includes("student name") &&
                !val.toLowerCase().includes("sl.") &&
                !val.toLowerCase().includes("ac. year")
              ) {
                name = val;
              }
            }

            if (!studentsMap.has(usn) || (!studentsMap.get(usn)!.personalEmail && email)) {
              studentsMap.set(usn, {
                usn,
                name: name || studentsMap.get(usn)?.name || `Student ${usn}`,
                personalEmail: email,
                phone,
                sourceFile: f,
              });
            }
          }
        }
      });
    }
  }

  // Also include Karri Uday student profile USN if not present
  if (!studentsMap.has("1BY23CS098")) {
    studentsMap.set("1BY23CS098", {
      usn: "1BY23CS098",
      name: "Karri Uday",
      personalEmail: "udaygdse@gmail.com",
      phone: "+919999999999",
      sourceFile: "AdminConfig",
    });
  }

  return Array.from(studentsMap.values());
}

if (process.argv[1] && process.argv[1].endsWith("parse-excel-students.ts")) {
  getStudentsFromExcel().then((students) => {
    console.log(`Extracted ${students.length} unique students from Excel:`);
    students.forEach((s, idx) => {
      console.log(`${idx + 1}. [${s.usn}] ${s.name} | ${s.personalEmail || "no email"} | ${s.phone || "no phone"} (${s.sourceFile})`);
    });
  });
}
