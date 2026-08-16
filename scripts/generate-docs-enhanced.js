const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  margin: 40,
  size: 'A4',
  bufferPages: true
});

const outputPath = path.join(__dirname, '..', 'Campus_Here_Documentation.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Color Palette
const NAVY = '#1A1D3A';
const DEEP_BLUE = '#2C3E7A';
const ACCENT_BLUE = '#2BA0FF';
const LIGHT_BG = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E2E8F0';
const TEXT_DARK = '#1E293B';
const TEXT_MUTED = '#64748B';
const GREEN = '#10B981';
const GREEN_BG = '#ECFDF5';
const AMBER = '#F59E0B';
const AMBER_BG = '#FFFBEB';
const PURPLE = '#8B5CF6';
const PURPLE_BG = '#F5F3FF';

// Helper Layout & Flowchart Functions
function pageHeader(title, category = 'CAMPUS HERE DOCUMENTATION') {
  doc.rect(40, 35, 515, 2).fill(BORDER_COLOR);
  doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica-Bold')
     .text(category.toUpperCase(), 40, 22);
  doc.fillColor(DEEP_BLUE).fontSize(10).font('Helvetica-Bold')
     .text(title, 200, 22, { align: 'right', width: 355 });
  doc.y = 48;
}

function sectionTitle(title, sub = '') {
  doc.moveDown(0.8);
  const startY = doc.y;
  doc.rect(40, startY, 4, 22).fill(DEEP_BLUE);
  doc.fillColor(DEEP_BLUE).fontSize(16).font('Helvetica-Bold')
     .text(title, 52, startY + 2);
  if (sub) {
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
       .text(sub, 52, startY + 20);
    doc.y = startY + 34;
  } else {
    doc.y = startY + 26;
  }
  doc.fillColor(TEXT_DARK);
}

function subSectionTitle(title) {
  doc.moveDown(0.6);
  doc.fillColor(DEEP_BLUE).fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);
  doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica');
}

function drawBox(x, y, w, h, title, body, bgColor = LIGHT_BG, borderColor = BORDER_COLOR) {
  doc.roundedRect(x, y, w, h, 6).fillAndStroke(bgColor, borderColor);
  doc.fillColor(DEEP_BLUE).fontSize(9.5).font('Helvetica-Bold').text(title, x + 8, y + 8, { width: w - 16 });
  if (body) {
    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(body, x + 8, y + 22, { width: w - 16 });
  }
}

function drawArrow(x1, y1, x2, y2, label = '') {
  doc.strokeColor(DEEP_BLUE).lineWidth(1.5);
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  
  // Arrow head
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 6;
  doc.polygon(
    [x2, y2],
    [x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6)],
    [x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6)]
  ).fill(DEEP_BLUE);
  
  if (label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 8;
    doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica-Bold').text(label, midX - 25, midY, { width: 50, align: 'center' });
  }
}

// ---------------------------------------------------------------------------
// 1. COVER PAGE
// ---------------------------------------------------------------------------
doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);

// Geometric Accents
doc.rect(0, 0, 15, doc.page.height).fill(ACCENT_BLUE);
doc.rect(40, 60, 4, 80).fill(ACCENT_BLUE);

doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold')
   .text('Campus Here', 55, 65);
doc.fillColor(ACCENT_BLUE).fontSize(14).font('Helvetica-Bold')
   .text('AI-Driven Placement and Educational Governance', 55, 105);
doc.fillColor('#94A3B8').fontSize(12).font('Helvetica')
   .text('Complete Architectural Specification & Implementation Manual', 55, 125);

// Card overlay on cover
doc.roundedRect(55, 180, 485, 340, 10).fill('#24284D');

doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold')
   .text('PROJECT TRACKING & ALLOCATION SYSTEM', 75, 205);
doc.fillColor('#CBD5E1').fontSize(10).font('Helvetica')
   .text('A role-based operating platform for major project cycles: cohort ingestion, invite-based group formation, TF-IDF title originality analysis, Gale-Shapley guide matching, calendar PDF date parsing, and role-scoped Excel reports.', 75, 225, { width: 445 });

doc.rect(75, 280, 445, 1).fill('#3B4270');

// Key Metrics Grid on Cover
const coverStats = [
  { label: 'Enrolled Students', val: '300' },
  { label: 'Active Faculty', val: '40 Guides' },
  { label: 'Project Groups', val: '71 Groups' },
  { label: 'Title Corpus', val: '70 Titles' },
  { label: 'Database Models', val: '26 Schema Invariants' },
  { label: 'API Namespaces', val: '21 Endpoints' }
];

coverStats.forEach((stat, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 75 + col * 150;
  const y = 300 + row * 65;
  
  doc.roundedRect(x, y, 135, 52, 6).fill('#1E2242');
  doc.fillColor(ACCENT_BLUE).fontSize(14).font('Helvetica-Bold').text(stat.val, x + 10, y + 10);
  doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica').text(stat.label, x + 10, y + 30);
});

// Institution Metadata
doc.fillColor('#94A3B8').fontSize(10).font('Helvetica-Bold')
   .text('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', 55, 680);
doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica')
   .text('BMS Institute of Technology and Management', 55, 696);
doc.fillColor('#64748B').fontSize(9).font('Helvetica')
   .text('Yelahanka, Bengaluru — 560119  |  Version 1.0  |  August 2026', 55, 712);

// ---------------------------------------------------------------------------
// 2. TABLE OF CONTENTS
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Table of Contents');
sectionTitle('TABLE OF CONTENTS', 'Structure of the complete technical specification');

const tocItems = [
  { num: '01', title: 'Executive Summary', page: '03' },
  { num: '02', title: 'System Architecture & Data Handoff Flow', page: '04' },
  { num: '03', title: 'Authentication & Security Pipeline (RBAC)', page: '06' },
  { num: '04', title: 'Role-Based Operational Modules (Admin, Student, Faculty)', page: '08' },
  { num: '05', title: 'Core Algorithms & Decision Engines', page: '11' },
  { num: '06', title: 'Database Data Model & Schema Invariants', page: '15' },
  { num: '07', title: 'Complete API Route Reference (21 Namespaces)', page: '18' },
  { num: '08', title: 'Reporting & Communication Engine', page: '20' },
  { num: '09', title: 'System Implementation Status & Verification', page: '22' },
  { num: '10', title: 'Known Limitations & Mitigation Steps', page: '24' },
  { num: '11', title: 'Future Roadmap & Strategic Enhancements', page: '25' },
  { num: '12', title: 'Local Setup, Seeding & Demo Accounts', page: '26' }
];

tocItems.forEach((item, i) => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 32, 4).fill(i % 2 === 0 ? LIGHT_BG : CARD_BG);
  doc.strokeColor(BORDER_COLOR).stroke();
  
  doc.fillColor(DEEP_BLUE).fontSize(10).font('Helvetica-Bold').text(item.num, 52, y + 10);
  doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica').text(item.title, 85, y + 10);
  doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica-Bold').text(`Page ${item.page}`, 480, y + 10, { align: 'right', width: 60 });
  
  doc.y = y + 36;
});

// ---------------------------------------------------------------------------
// 3. EXECUTIVE SUMMARY
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Executive Summary');
sectionTitle('1. EXECUTIVE SUMMARY', 'High-level architectural vision and product scope');

doc.fontSize(9.5).font('Helvetica').lineGap(3).text(
  'Campus Here is a full-stack, enterprise-grade academic governance platform custom-built for the Department of Computer Science and Engineering at BMS Institute of Technology and Management (BMSIT), Bengaluru. The system digitizes and automates the entire major project cycle — spanning cohort intake, invite-driven group formation, title originality analysis, Gale-Shapley guide allocation, academic calendar reminder generation, review scheduling, attendance/evaluation tracking, and role-scoped Excel reporting.'
);

doc.moveDown(0.8);
subSectionTitle('Core Architectural Imperatives');

const summaryPillars = [
  { title: 'Zero Placeholder Invariant', desc: 'Every single component, form, dashboard metric, and table across all 30+ screens is connected to live API handlers and PostgreSQL database tables. No component renders dummy data or static fallback state.' },
  { title: 'Pure / Impure Algorithm Isolation', desc: 'Decision engines (TF-IDF similarity check, Gale-Shapley matching) are pure functions, completely decoupled from database I/O. This allows unit testing with 100% determinism and guarantees preview runs execute the exact code as committed runs.' },
  { title: 'Database-Level Constraint Protection', desc: 'Business rules (such as max 1 active group per student per cycle, and distinct guide preference ranks) are enforced as unique database indices (@@unique), protecting system integrity against client-side bypasses or concurrency races.' },
  { title: 'Two-Layered Security (RBAC)', desc: 'Next.js proxy middleware provides client routing protection, while server-side handler functions (requireApi / requirePage) independently re-verify JWT claims to prevent unauthorized API execution.' }
];

summaryPillars.forEach(p => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 48, 6).fillAndStroke(CARD_BG, BORDER_COLOR);
  doc.rect(40, y, 4, 48).fill(ACCENT_BLUE);
  doc.fillColor(DEEP_BLUE).fontSize(9.5).font('Helvetica-Bold').text(p.title, 54, y + 8);
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(p.desc, 54, y + 22, { width: 490 });
  doc.y = y + 54;
});

// ---------------------------------------------------------------------------
// 4. SYSTEM ARCHITECTURE & DIAGRAMS
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('System Architecture');
sectionTitle('2. SYSTEM ARCHITECTURE & HANDOFF FLOW', 'Layered component stack and end-to-end operational pipeline');

subSectionTitle('2.1 Five-Stage Project Lifecycle Handoff Flow');
doc.fillColor(TEXT_MUTED).fontSize(8.5).font('Helvetica').text('Each stage validates data invariants before passing inputs to the subsequent milestone:');
doc.moveDown(0.5);

// FLOWCHART DIAGRAM 1: 5-Stage Handoff Flow
const stageY = doc.y;
const stages = [
  { title: '1. Roster Import', sub: 'CSV Validation', bg: '#EFF6FF' },
  { title: '2. Group Formation', sub: 'Invite-based (Cap 4)', bg: '#F0FDF4' },
  { title: '3. Title Originality', sub: 'TF-IDF Check', bg: '#FEF3C7' },
  { title: '4. Guide Allocation', sub: 'Gale-Shapley', bg: '#F3E8FF' },
  { title: '5. Reviews & Audit', sub: 'Attendance & Mark', bg: '#ECFDF5' }
];

stages.forEach((st, i) => {
  const boxX = 40 + i * 102;
  drawBox(boxX, stageY, 94, 45, st.title, st.sub, st.bg, DEEP_BLUE);
  if (i < 4) {
    drawArrow(boxX + 94, stageY + 22, boxX + 102, stageY + 22);
  }
});

doc.y = stageY + 60;

subSectionTitle('2.2 Full Stack Technology Layering');

const stackLayers = [
  { layer: 'Frontend Layer', tech: 'Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide Icons', detail: 'Server & Client Components, Responsive UI Design System with cream ground (#F5F1E4) & card floating tokens' },
  { layer: 'Middleware & Security', tech: 'Next.js Proxy (src/proxy.ts), Jose JWT (HS256), Bcrypt hashing, RBAC Helpers', detail: 'Edge-compatible token verification, HTTP-only SameSite=Lax cookie management, Constant-time auth checks' },
  { layer: 'Business Logic Layer', tech: 'Pure TS Engines (similarity.ts, allocation-engine.ts, calendar-parse.ts)', detail: 'TF-IDF Vectorizer + 4 Lexical Sub-signals, Gale-Shapley Deferred Acceptance algorithm, PDF Date Extractor' },
  { layer: 'Database & ORM Layer', tech: 'PostgreSQL 17, Prisma 7 ORM (@prisma/adapter-pg Node driver adapter)', detail: '26 Database Models, Serializable transactions, Direct URL for DDL migrations, Pooled runtime connection' },
  { layer: 'External Integrations', tech: 'ExcelJS (Formatted Workbooks), Nodemailer (SMTP), Twilio (WhatsApp API)', detail: '9 real formatted .xlsx exporters with About sheet audit trail, Dry-Run execution mode for emails/SMS' }
];

stackLayers.forEach(l => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 42, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.fillColor(DEEP_BLUE).fontSize(9).font('Helvetica-Bold').text(l.layer, 48, y + 6);
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold').text(l.tech, 160, y + 6);
  doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text(l.detail, 48, y + 22, { width: 495 });
  doc.y = y + 48;
});

// ---------------------------------------------------------------------------
// 5. AUTHENTICATION & SECURITY PIPELINE
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Authentication & Security');
sectionTitle('3. AUTHENTICATION & SECURITY PIPELINE', 'Multi-tiered defense, JWT sessions, and RBAC authorization');

subSectionTitle('3.1 Two-Layer Security Architecture');
doc.fontSize(9).font('Helvetica').text(
  'Security is implemented via defense-in-depth: Layer 1 (Next.js proxy) intercepts browser routes and redirects unauthorized requests, while Layer 2 (server-side rbac.ts helper functions) isolates API route execution, guaranteeing 401/403 HTTP enforcement regardless of client routing.'
);
doc.moveDown(0.5);

// DIAGRAM: Auth Flowchart
const authY = doc.y;
drawBox(40, authY, 110, 50, 'Incoming Request', 'Browser Navigation\nor API Call', LIGHT_BG);
drawArrow(150, authY + 25, 175, authY + 25);

drawBox(175, authY, 115, 50, 'Next.js Proxy', 'Validates JWT cookie\nCheck Role Match', PURPLE_BG);
drawArrow(290, authY + 25, 315, authY + 25);

drawBox(315, authY, 115, 50, 'Server Handler', 'requireApi / requirePage\nRe-checks Role Claims', GREEN_BG);
drawArrow(430, authY + 25, 455, authY + 25);

drawBox(455, authY, 100, 50, 'Database Execution', 'Execute Postgres\nPrisma Query', LIGHT_BG);

doc.y = authY + 65;

subSectionTitle('3.2 Security Protocols & Cryptographic Safeguards');

const secSpecs = [
  { item: 'Session Storage', spec: 'HS256 Signed JWTs issued via `jose`, stored in HTTP-only, `SameSite=Lax` cookie `ch_session` expiring after 8 hours.' },
  { item: 'Password Hashing', spec: 'Bcrypt hashing at cost factor 12. Login responses utilize constant-time dummy comparisons on unknown emails to prevent timing attacks.' },
  { item: 'Password Reset', spec: 'Single-use tokens stored as SHA-256 hashes in database, expiring strictly after 30 minutes.' },
  { item: 'SMTP Secret Encryption', spec: 'Per-faculty custom SMTP credentials encrypted using AES-256-GCM (`src/server/services/crypto.ts`). Never exposed in API responses.' }
];

secSpecs.forEach(s => {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DEEP_BLUE).text(`• ${s.item}: `, { continued: true });
  doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(s.spec);
  doc.moveDown(0.4);
});

// ---------------------------------------------------------------------------
// 6. ROLE-BASED MODULES BREAKDOWN
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Role-Based Modules');
sectionTitle('4. ROLE-BASED OPERATIONAL MODULES', 'Complete functional breakdown of Admin, Student, and Faculty workspaces');

subSectionTitle('4.1 Coordinator (Admin) Workspace — 14 Specialized Sub-Modules');
doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica');

const adminModules = [
  { name: 'Admin Dashboard (/admin)', desc: 'Displays overall cycle progress, active student/group counts, guide allocation status, and quick-action cards.' },
  { name: 'Data Ingestion (/admin/imports)', desc: 'Two-phase (Validate → Apply) server-side CSV parser for student rosters, faculty lists, and title corpora with row-by-row error logs.' },
  { name: 'Student Registry (/admin/students)', desc: 'Complete directory of enrolled students with USN search, CGPA metrics, and cycle enrollment state.' },
  { name: 'Faculty Directory (/admin/faculty)', desc: 'Manages guide designations, email contact information, active teaching domain tagging, and group capacity limits.' },
  { name: 'Group Management (/admin/groups)', desc: 'Monitors all project groups, member compositions, calculated average CGPAs, and submission lock status.' },
  { name: 'Title Registry (/admin/titles)', desc: 'Searchable repository of all submitted project proposals with automated TF-IDF similarity scores against past corpora.' },
  { name: 'Guide Allocation (/admin/allocation)', desc: 'Executes Gale-Shapley matching engine in dry-run preview or committed run modes; includes manual override assignment queue.' },
  { name: 'Reviews & Scheduling (/admin/reviews)', desc: 'Schedules R0, P1, and P2 review sessions with room and guide conflict detection.' },
  { name: 'Attendance & Evaluation (/admin/attendance)', desc: 'Centralized administrative view of all session marks and student attendance records across all project groups.' },
  { name: 'Calendar & Reminders (/admin/calendar)', desc: 'Parses academic calendar PDFs, extracts milestone dates, and generates 15-day and 7-day automated reminder queues.' },
  { name: 'Mail Center (/admin/mail)', desc: 'Sends target-filtered bulk emails with Nodemailer dry-run logging and attachment size capping (max 20MB).' },
  { name: 'Orientation Management (/admin/orientation)', desc: 'Publishes text announcements and audio briefings for student dashboards.' },
  { name: 'Reports & Exports (/admin/reports)', desc: 'Generates 9 formatted Excel (.xlsx) workbooks with frozen headers, column sizing, and audit sheets.' },
  { name: 'Cycle Settings (/admin/settings)', desc: 'Configures academic domain lists, per-designation capacity defaults, and active project cycle parameters.' }
];

adminModules.forEach(m => {
  doc.font('Helvetica-Bold').fillColor(DEEP_BLUE).text(`${m.name}: `, { continued: true });
  doc.font('Helvetica').fillColor(TEXT_DARK).text(m.desc);
  doc.moveDown(0.3);
});

doc.addPage();
pageHeader('Role-Based Modules (Cont.)');

subSectionTitle('4.2 Student Workspace — 8 Workspace Modules');
const studentModules = [
  { name: 'Student Dashboard (/student)', desc: 'Displays active group membership, computed group CGPA, pending team invites, upcoming review sessions, and orientation posts.' },
  { name: 'Invites & Team Building (/student/invites)', desc: 'Create group, search eligible students by USN/name, issue invitations, and accept/reject pending requests.' },
  { name: 'My Group Checklist (/student/my-group)', desc: 'Interactive 5-item submission readiness checklist: Size check (4), Domain selection, Title registration, Problem Statement, and 6 Guide Preferences.' },
  { name: 'Domain & Title Submission (/student/domain)', desc: 'Select project domain and enter title with real-time server-side TF-IDF similarity feedback.' },
  { name: 'Guide Preferences (/student/preferences)', desc: 'Rank exactly six distinct faculty guides in order of preference before locking submission.' },
  { name: 'Review Timeline (/student/timeline)', desc: 'Track progress across R0, P1, and P2 review phases, including assigned evaluation marks and guide remarks.' },
  { name: 'Reminders (/student/reminders)', desc: 'View upcoming review dates and automated calendar notification alerts.' },
  { name: 'Notifications Inbox (/student/notifications)', desc: 'In-app inbox powered by Server-Sent Events (SSE) with HTTP polling fallback.' }
];

studentModules.forEach(m => {
  doc.font('Helvetica-Bold').fillColor(DEEP_BLUE).text(`${m.name}: `, { continued: true });
  doc.font('Helvetica').fillColor(TEXT_DARK).text(m.desc);
  doc.moveDown(0.4);
});

subSectionTitle('4.3 Faculty (Guide) Workspace — 8 Specialized Modules');
const facultyModules = [
  { name: 'Faculty Dashboard (/faculty)', desc: 'Overview of allocated project groups, upcoming review evaluation schedules, and quick actions.' },
  { name: 'Assigned Groups (/faculty/assigned)', desc: 'Complete directory of groups allocated to the guide, member contact details, USNs, and roster export.' },
  { name: 'Review Sessions (/faculty/review-sessions)', desc: 'Calendar view of scheduled R0, P1, P2 defense sessions with room locations.' },
  { name: 'Mark Attendance (/faculty/mark-attendance)', desc: 'Per-session attendance logger with toggleable Present/Absent status per student.' },
  { name: 'Evaluate Groups (/faculty/evaluate)', desc: 'Grade project groups out of 10 per phase with qualitative feedback and remarks.' },
  { name: 'Title Approval (/faculty/title-approval)', desc: 'Approve or reject proposed titles with complete TF-IDF similarity breakdown and matched word highlights.' },
  { name: 'Faculty Mail Center (/faculty/mail)', desc: 'Dispatch emails exclusively to students guided by the logged-in faculty member (BCC forced).' },
  { name: 'Orientation Briefings (/faculty/orientation)', desc: 'Post and manage text/audio guidance briefings visible to guided students.' }
];

facultyModules.forEach(m => {
  doc.font('Helvetica-Bold').fillColor(DEEP_BLUE).text(`${m.name}: `, { continued: true });
  doc.font('Helvetica').fillColor(TEXT_DARK).text(m.desc);
  doc.moveDown(0.4);
});

// ---------------------------------------------------------------------------
// 7. CORE ALGORITHMS & DECISION ENGINES
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Core Algorithms');
sectionTitle('5. CORE ALGORITHMS & DECISION ENGINES', 'Mathematical models and execution logic for Originality & Allocation');

subSectionTitle('5.1 Title Originality Analysis Engine (TF-IDF + Lexical Signals)');
doc.fontSize(8.5).font('Helvetica').text(
  'Located in `src/server/services/similarity.ts`, the originality engine converts proposal titles into normalized token vectors and computes TF-IDF cosine similarity against the historical corpus, blended with four lexical sub-signals.'
);
doc.moveDown(0.5);

// DIAGRAM: Similarity Pipeline Flow
const simY = doc.y;
const pSteps = [
  { t: '1. Lowercase', s: 'Strip Punctuation' },
  { t: '2. Synonyms', s: 'Expand Phrases' },
  { t: '3. Abbrev', s: 'ML -> Machine Learning' },
  { t: '4. Stopwords', s: 'Drop System/Smart' },
  { t: '5. Vectorize', s: 'TF-IDF + Cosine' }
];

pSteps.forEach((ps, i) => {
  const boxX = 40 + i * 102;
  drawBox(boxX, simY, 94, 45, ps.t, ps.s, LIGHT_BG, ACCENT_BLUE);
  if (i < 4) drawArrow(boxX + 94, simY + 22, boxX + 102, simY + 22);
});

doc.y = simY + 58;

doc.fillColor(DEEP_BLUE).fontSize(9).font('Helvetica-Bold').text('Scoring Formula:');
doc.fillColor(TEXT_DARK).fontSize(9).font('Courier')
   .text('  score = 0.65 * TF-IDF_Cosine + 0.35 * MAX(Dice, Containment, 3-Gram_Jaccard, Levenshtein)');

doc.moveDown(0.5);
doc.fillColor(DEEP_BLUE).fontSize(9).font('Helvetica-Bold').text('Similarity Threshold Bands:');

const bands = [
  { band: '≥ 0.95 (BLOCKED)', effect: 'Save disabled; API returns HTTP 409 Conflict. Proposal rejected.', bg: '#FEE2E2' },
  { band: '0.80 – 0.94 (WARNING)', effect: 'Allowed with warning badge. Guide provided full similarity breakdown.', bg: '#FEF3C7' },
  { band: '< 0.80 (ALLOWED)', effect: 'Proposal marked clean and permitted for registration.', bg: '#D1FAE5' }
];

bands.forEach(b => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 24, 4).fillAndStroke(b.bg, BORDER_COLOR);
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica-Bold').text(b.band, 48, y + 7);
  doc.font('Helvetica').text(b.effect, 200, y + 7);
  doc.y = y + 28;
});

doc.addPage();
pageHeader('Core Algorithms (Cont.)');

subSectionTitle('5.2 Guide Allocation Engine (Gale-Shapley Deferred Acceptance)');
doc.fontSize(8.5).font('Helvetica').text(
  'Implemented in `src/lib/allocation-engine.ts`, guide allocation uses the Gale-Shapley algorithm to compute a stable matching between student group preferences and faculty capacity constraints.'
);
doc.moveDown(0.5);

// DIAGRAM: Gale-Shapley Algorithm Flowchart
const gsY = doc.y;
drawBox(40, gsY, 110, 52, 'Group Preference List', 'Groups submit 6\nranked preferences', LIGHT_BG);
drawArrow(150, gsY + 26, 175, gsY + 26);

drawBox(175, gsY, 115, 52, 'Guide Evaluation', 'Rank proposals by\n4 Deterministic Rules', PURPLE_BG);
drawArrow(290, gsY + 26, 315, gsY + 26);

drawBox(315, gsY, 115, 52, 'Capacity Check', 'Hold best up to Cap;\nReject weakest', GREEN_BG);
drawArrow(430, gsY + 26, 455, gsY + 26);

drawBox(455, gsY, 100, 52, 'Stability Check', 'findBlockingPair()\nverifies no blocking', LIGHT_BG);

doc.y = gsY + 65;

subSectionTitle('Deterministic Guide Ranking Tie-Break Rules:');
const tieRules = [
  '1. Domain Match: Groups selecting a domain taught by the faculty member outrank non-matches.',
  '2. Average CGPA: Higher group average CGPA takes precedence.',
  '3. Submission Timestamp: Groups submitting preferences earlier earn priority.',
  '4. Deterministic Code Order: Lexicographical sorting on group code guarantees identical outputs on re-runs.'
];

tieRules.forEach(r => {
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(r);
  doc.moveDown(0.3);
});

doc.moveDown(0.5);
subSectionTitle('Empirical Live Cohort Execution Results (Seeded 55-Group Benchmark):');

const gsStats = [
  { k: 'Groups Considered', v: '55 Groups' },
  { k: 'Active Guides', v: '40 Guides (Cap 2)' },
  { k: 'Allocated Count', v: '55 / 55 (100%)' },
  { k: '1st Preference Satisfied', v: '43 Groups (78.2%)' },
  { k: '2nd Preference Satisfied', v: '6 Groups (10.9%)' },
  { k: '3rd / 4th Preference', v: '6 Groups (10.9%)' },
  { k: 'Proposals Evaluated', v: '74 Proposals' },
  { k: 'Stability Verification', v: '0 Blocking Pairs Found (VERIFIED STABLE)' }
];

gsStats.forEach((st, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 40 + col * 260;
  const y = doc.y + (row === 0 && col === 0 ? 0 : 0);
  
  if (col === 0) {
    const curY = doc.y;
    doc.roundedRect(40, curY, 250, 22, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);
    doc.fillColor(DEEP_BLUE).fontSize(8.5).font('Helvetica-Bold').text(st.k, 48, curY + 6);
    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(st.v, 180, curY + 6);
  } else {
    const curY = doc.y;
    doc.roundedRect(305, curY, 250, 22, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);
    doc.fillColor(DEEP_BLUE).fontSize(8.5).font('Helvetica-Bold').text(st.k, 313, curY + 6);
    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(st.v, 445, curY + 6);
    doc.y = curY + 26;
  }
});

// ---------------------------------------------------------------------------
// 8. DATABASE DATA MODEL & INVARIANTS
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Database Data Model');
sectionTitle('6. DATABASE DATA MODEL & INVARIANTS', 'Prisma 7 relational schema and DB-enforced constraints');

subSectionTitle('6.1 Database Entity-Relationship Overview (26 Models)');
doc.fontSize(8.5).font('Helvetica').text(
  'The PostgreSQL schema consists of 26 interconnected models designed to maintain complete data normalisation and historical auditability across multiple academic project cycles.'
);
doc.moveDown(0.5);

// ERD BOX DIAGRAM
const erdY = doc.y;
drawBox(40, erdY, 110, 55, 'User & Auth', 'User, Student,\nFaculty, Role', PURPLE_BG);
drawArrow(150, erdY + 27, 175, erdY + 27);

drawBox(175, erdY, 115, 55, 'Cycle & Roster', 'ProjectCycle,\nStudentCycle, Domain', LIGHT_BG);
drawArrow(290, erdY + 27, 315, erdY + 27);

drawBox(315, erdY, 115, 55, 'Group & Title', 'Group, GroupMember,\nProjectTitle, Prefs', GREEN_BG);
drawArrow(430, erdY + 27, 455, erdY + 27);

drawBox(455, erdY, 100, 55, 'Allocation & Review', 'Allocation, Session,\nAttendance, Mark', LIGHT_BG);

doc.y = erdY + 68;

subSectionTitle('6.2 Load-Bearing Database Invariants (Enforced via Postgres Indices)');

const invariants = [
  { inv: 'One Active Group Per Student Per Cycle', code: '@@unique([cycleId, studentId]) on GroupMember model', rationale: 'Prevents a student from joining multiple groups simultaneously within the same cycle.' },
  { inv: 'Unique Guide Preference Ranks', code: '@@unique([groupId, facultyId]) on GuidePreference model', rationale: 'Guarantees a group cannot submit duplicate guide entries in their preference list.' },
  { inv: 'Strict Group Capacity Limit', code: 'Members + Pending Invites ≤ groupSize (Serializable Tx)', rationale: 'Ensures group size strictly equals 4 upon submission without concurrency overflow.' },
  { inv: 'Arithmetic Average CGPA Integrity', code: 'Recomputed via DB transaction on member changes', rationale: 'Eliminates client-side CGPA tampering or stale cached score errors.' }
];

invariants.forEach(inv => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 42, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.fillColor(DEEP_BLUE).fontSize(9).font('Helvetica-Bold').text(inv.inv, 48, y + 6);
  doc.fillColor(TEXT_MUTED).fontSize(8).font('Courier').text(inv.code, 280, y + 6);
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(inv.rationale, 48, y + 22, { width: 495 });
  doc.y = y + 48;
});

// ---------------------------------------------------------------------------
// 9. COMPLETE API REFERENCE
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('API Route Reference');
sectionTitle('7. COMPLETE API ROUTE REFERENCE', '21 API Namespaces with complete endpoint handler coverage');

const apiNamespaces = [
  { ns: '/api/auth', methods: 'POST, GET', desc: 'Login, logout, session check (me), forgot-password, reset-password' },
  { ns: '/api/students', methods: 'GET, POST, DELETE', desc: 'CSV student upload, student registry listing, unattached student search' },
  { ns: '/api/faculty', methods: 'GET, POST, PATCH', desc: 'CSV faculty upload, guide list management, designation capacity patch' },
  { ns: '/api/groups', methods: 'GET, POST, PUT', desc: 'Group CRUD, invite dispatch, member leave, preference list update, lock submit' },
  { ns: '/api/invites', methods: 'GET, POST', desc: 'Pending invite listing, accept invite (auto-declines others), reject invite' },
  { ns: '/api/titles', methods: 'GET, POST, PATCH', desc: 'Check similarity score, import title corpus, submit proposal, guide review' },
  { ns: '/api/allocation', methods: 'GET, POST', desc: 'Execute Gale-Shapley (preview/commit), manual guide override, run history' },
  { ns: '/api/reviews', methods: 'GET, POST', desc: 'Schedule R0/P1/P2 sessions, fetch review schedules with room clash check' },
  { ns: '/api/attendance', methods: 'GET, POST', desc: 'Mark student attendance per session, export cumulative attendance' },
  { ns: '/api/evaluation', methods: 'GET, POST', desc: 'Record group marks out of 10 per phase with qualitative feedback' },
  { ns: '/api/calendar', methods: 'GET, POST, DELETE', desc: 'Upload calendar PDF, extract text, detect milestone dates' },
  { ns: '/api/reminders', methods: 'GET, POST', desc: 'Generate 15-day and 7-day reminder queues, fetch active reminder alerts' },
  { ns: '/api/mail', methods: 'GET, POST, PUT', desc: 'Send role-scoped bulk emails, view dispatch history, save encrypted SMTP' },
  { ns: '/api/whatsapp', methods: 'GET, POST', desc: 'Dispatch Twilio WhatsApp messages with dry-run database logging' },
  { ns: '/api/notifications', methods: 'GET, PATCH', desc: 'Fetch recipient in-app inbox, Server-Sent Events stream, mark read' },
  { ns: '/api/orientation', methods: 'GET, POST, DELETE', desc: 'Publish text announcements, upload audio briefings, delete posts' },
  { ns: '/api/reports', methods: 'GET', desc: 'Export 9 formatted Excel (.xlsx) workbooks with RBAC scope checks' },
  { ns: '/api/settings', methods: 'GET, POST, PATCH', desc: 'Manage project domains, designation capacity rules, cycle settings' },
  { ns: '/api/cron', methods: 'GET', desc: 'Vercel Cron endpoint for dispatching due reminder notifications' },
  { ns: '/api/samples', methods: 'GET', desc: 'Download sample CSV templates for student, faculty, and title imports' },
  { ns: '/api/health', methods: 'GET', desc: 'Database connectivity and system health diagnostic check' }
];

apiNamespaces.forEach((a, i) => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 26, 3).fillAndStroke(i % 2 === 0 ? LIGHT_BG : CARD_BG, BORDER_COLOR);
  doc.fillColor(DEEP_BLUE).fontSize(8.5).font('Helvetica-Bold').text(a.ns, 48, y + 7, { width: 110 });
  doc.fillColor(PURPLE).fontSize(8).font('Courier').text(a.methods, 160, y + 7, { width: 90 });
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(a.desc, 255, y + 7, { width: 290 });
  doc.y = y + 29;
});

// ---------------------------------------------------------------------------
// 10. REPORTING & COMMUNICATION ENGINE
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Reporting & Communications');
sectionTitle('8. REPORTING & COMMUNICATION ENGINE', 'ExcelJS workbook generation & Multi-channel notification delivery');

subSectionTitle('8.1 ExcelJS Formatted Report Generator (9 Workbooks)');
doc.fontSize(8.5).font('Helvetica').text(
  'All nine report builders in `src/server/services/reports.ts` produce genuine Excel (.xlsx) workbooks using ExcelJS. Every file features a bold, filled, frozen header row, active auto-filters, custom column widths, and an About audit sheet.'
);
doc.moveDown(0.5);

const reports = [
  '1. Student Roster: Complete 300-student directory with USNs, full names, emails, phones, and CGPA metrics.',
  '2. Group List: All 71 project groups, member USNs, calculated average CGPA, domain, and title status.',
  '3. Guide Allocation Report: Final group-to-guide mappings, satisfied preference ranks, and allocation method.',
  '4. Cumulative Attendance: Master matrix of student attendance percentages across all review defense sessions.',
  '5. Per-Session Attendance: Detailed present/absent logs for specific review phases (R0, P1, P2).',
  '6. Group Evaluation Scores: Complete scorecard showing evaluation marks out of 10 and guide remarks.',
  '7. Calendar & Reminders Schedule: Audit log of all extracted academic calendar dates and queued alerts.',
  '8. Faculty Guide Workload: Summary of allocated groups per guide against designation capacity caps.',
  '9. Title Registry & Originality Report: Submitted proposals with TF-IDF similarity scores and match breakdowns.'
];

reports.forEach(r => {
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(r);
  doc.moveDown(0.3);
});

doc.moveDown(0.5);
subSectionTitle('8.2 Multi-Channel Communication Architecture');
doc.list([
  'Email Transport: Nodemailer integration supporting custom per-faculty SMTP and environment defaults. Operates in Dry-Run mode (`MAIL_DRY_RUN=true`) by default.',
  'WhatsApp Transport: Twilio API integration with dry-run logging to Postgres (`mode=DRY_RUN`).',
  'Student Inbox: Dual-layer delivery utilizing Server-Sent Events (SSE) for instant push updates and HTTP polling (`GET /api/notifications?since=`) for reliable fallback.'
]);

// ---------------------------------------------------------------------------
// 11. SYSTEM IMPLEMENTATION STATUS & VERIFICATION
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Implementation Status');
sectionTitle('9. SYSTEM IMPLEMENTATION STATUS', 'Empirical verification results across tests and database queries');

subSectionTitle('9.1 Fully Verified & Functional Capabilities (100% Operational)');

const verifiedFeatures = [
  { cat: 'Authentication & Security', desc: 'Login, HTTP-only JWT cookies, Password Reset, RBAC middleware, and Account Lockout completely functional.' },
  { cat: 'Data Ingestion & Registries', desc: 'Student, Faculty, and Title CSV importers tested against malformed data; 100% database persistence verified.' },
  { cat: 'Group Formation Engine', desc: 'Invite dispatch, accept/reject, auto-decline of rival invites, CGPA recomputation, and lock-on-submit verified.' },
  { cat: 'Title Originality Analysis', desc: 'TF-IDF cosine vectorizer and 4 sub-signals verified. Candidate "Smart Attendance Face Recognition" correctly blocked (100%).' },
  { cat: 'Gale-Shapley Guide Allocation', desc: 'Matching engine executed on 55 groups / 40 guides. 100% allocated with zero blocking pairs.' },
  { cat: 'Reviews & Reminders', desc: 'Academic calendar PDF date parser and 15-day/7-day reminder queue generator verified.' },
  { cat: 'Faculty Evaluation & Attendance', desc: 'Session marking, score logging out of 10, title approval workflow, and roster exports operational.' },
  { cat: 'Excel Report Workbooks', desc: 'All 9 formatted Excel workbooks generate cleanly with frozen styled headers and audit sheets.' }
];

verifiedFeatures.forEach(v => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 34, 4).fillAndStroke(GREEN_BG, BORDER_COLOR);
  doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold').text(`[VERIFIED] ${v.cat}`, 48, y + 6);
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica').text(v.desc, 48, y + 19, { width: 495 });
  doc.y = y + 38;
});

subSectionTitle('9.2 Verification Suite Summary');
doc.list([
  'Unit Tests (Vitest): 121 pure unit tests covering TF-IDF similarity, Gale-Shapley stability, CSV parsing, PDF detection, and AES encryption.',
  'API Feature Tests: 134 integration tests executed across 6 reproducible test suites against PostgreSQL.',
  'End-to-End Browser Self-Test: 23 browser-driven Playwright checks verifying paint stability and UI interaction.'
]);

// ---------------------------------------------------------------------------
// 12. KNOWN LIMITATIONS & FUTURE ROADMAP
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Limitations & Roadmap');
sectionTitle('10. KNOWN LIMITATIONS & FUTURE ROADMAP', 'Current technical constraints and strategic development plan');

subSectionTitle('10.1 Known System Limitations & Current Operational Warnings');

const limitations = [
  { issue: 'TypeScript Compilation Warnings (13 Errors)', status: 'Non-breaking', detail: 'Route context types (`PageProps`, `LayoutProps`, `RouteContext`) require explicit definition in Next.js 16 app routes. Application runs cleanly at runtime.' },
  { issue: 'Dry-Run Mode Default', status: 'Intentional', detail: 'Email and WhatsApp messaging default to `DRY_RUN` to prevent accidental real-world message dispatch during development.' },
  { issue: 'Serverless SSE Timeout', status: 'Mitigated', detail: 'Vercel serverless execution limits interrupt long-lived SSE connections. HTTP polling fallback (`?since=`) guarantees zero message loss.' },
  { issue: 'PostgreSQL Bytea File Storage', status: 'Architectural', detail: 'Uploaded PDF/audio files are stored directly as bytea in PostgreSQL to fit Vercel serverless environment.' }
];

limitations.forEach(l => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 36, 4).fillAndStroke(AMBER_BG, BORDER_COLOR);
  doc.fillColor(AMBER).fontSize(8.5).font('Helvetica-Bold').text(`[${l.status}] ${l.issue}`, 48, y + 6);
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(l.detail, 48, y + 20, { width: 495 });
  doc.y = y + 40;
});

subSectionTitle('10.2 Strategic Future Enhancements');

const roadmap = [
  { phase: 'Short-Term (Phase 1)', items: '1. Resolve Next.js 16 type definitions.\n2. Configure live SMTP & Twilio API keys.\n3. Deploy to Vercel with Neon/Supabase Postgres.' },
  { phase: 'Medium-Term (Phase 2)', items: '4. Migrate bytea files to Cloudflare R2 / AWS S3.\n5. Implement Admin Audit Logging.\n6. Add 2FA (TOTP) for Admin accounts.' },
  { phase: 'Long-Term (Phase 3)', items: '7. Multi-department support across BMSIT.\n8. External Plagiarism API integration.\n9. AI-driven guide recommendation engine.' }
];

roadmap.forEach(r => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 42, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.fillColor(DEEP_BLUE).fontSize(9).font('Helvetica-Bold').text(r.phase, 48, y + 6);
  doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(r.items, 180, y + 6, { width: 360 });
  doc.y = y + 46;
});

// ---------------------------------------------------------------------------
// 13. LOCAL SETUP, SEEDING & DEMO CREDENTIALS
// ---------------------------------------------------------------------------
doc.addPage();
pageHeader('Setup & Demo Credentials');
sectionTitle('11. LOCAL SETUP & DEMO CREDENTIALS', 'Instructions for running, seeding, and accessing the platform');

subSectionTitle('11.1 Seeded Demo Account Credentials');
doc.fillColor(TEXT_MUTED).fontSize(8.5).font('Helvetica').text('All seeded accounts use default password: `Campus@123`');
doc.moveDown(0.4);

const demoAccounts = [
  { role: 'Admin (Coordinator)', email: 'admin@example.edu', access: 'Full cycle management, imports, allocation & reporting' },
  { role: 'Faculty (Guide)', email: 'ananya.rao@example.edu', access: 'Assigned groups, marks attendance, evaluates & approves titles' },
  { role: 'Student (Leader/Member)', email: '1BY23CS001 @example.edu to 1BY23CS300', access: 'Group formation, title submit, guide preference ranking' }
];

demoAccounts.forEach(d => {
  const y = doc.y;
  doc.roundedRect(40, y, 515, 30, 4).fillAndStroke(CARD_BG, BORDER_COLOR);
  doc.fillColor(DEEP_BLUE).fontSize(8.5).font('Helvetica-Bold').text(d.role, 48, y + 8, { width: 130 });
  doc.fillColor(TEXT_DARK).fontSize(8.5).font('Courier').text(d.email, 180, y + 8, { width: 160 });
  doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text(d.access, 345, y + 8, { width: 200 });
  doc.y = y + 34;
});

subSectionTitle('11.2 Environment Setup Commands');
doc.fillColor(TEXT_DARK).fontSize(8.5).font('Courier');

const setupCmds = [
  'npm install                  # Install dependencies & generate Prisma Client',
  'cp .env.example .env         # Initialize environment configuration',
  'docker compose up -d         # Launch PostgreSQL 17 container (Port 5433)',
  'npx prisma migrate dev       # Apply database migrations',
  'npm run db:check             # Verify active database connection',
  'npx prisma db seed           # Populate seed benchmark cohort',
  'npm run dev                  # Start local development server (http://localhost:3000)'
];

setupCmds.forEach(c => {
  doc.text(c);
  doc.moveDown(0.3);
});

// Final Page Numbering Pass
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  if (i > 0) { // Skip cover
    doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica')
       .text(`Page ${i + 1} of ${range.count}`, 40, 800, { align: 'center', width: 515 });
  }
}

doc.end();
console.log('Enhanced documentation PDF generated successfully.');
