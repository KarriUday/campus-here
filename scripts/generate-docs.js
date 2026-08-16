const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const outputPath = path.join(__dirname, '..', 'Campus_Here_Documentation.pdf');
doc.pipe(fs.createWriteStream(outputPath));

const PRIMARY_COLOR = '#2C3E7A';
const SECONDARY_COLOR = '#1a1d3a';
const TEXT_COLOR = '#333333';
const GREEN_TICK = '#22c55e';
const AMBER_WARN = '#f59e0b';

// Helper functions
function addPageNumber() {
    const range = doc.bufferedPageRange(); 
    // we'll do this at the end
}

// Cover Page
doc.rect(0, 0, doc.page.width, doc.page.height).fill(SECONDARY_COLOR);
doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold')
   .text('Campus Here', 0, 300, { align: 'center' });
doc.fontSize(16).font('Helvetica')
   .text('AI-Driven Placement and Educational Governance', { align: 'center' });
doc.moveDown(1);
doc.fontSize(14).font('Helvetica-Oblique')
   .text('Project Tracking & Allocation System', { align: 'center' });
doc.moveDown(4);
doc.fontSize(12).font('Helvetica')
   .text('Institution: BMS Institute of Technology and Management', { align: 'center' })
   .text('Department: Computer Science & Engineering, Bengaluru — 560119', { align: 'center' })
   .text('Date: August 2026', { align: 'center' });
   
doc.addPage();

// Rest of the pages
doc.fillColor(TEXT_COLOR);

function renderHeader(title) {
    doc.fillColor(PRIMARY_COLOR).fontSize(20).font('Helvetica-Bold').text(title);
    doc.moveDown(0.5);
    doc.fillColor(TEXT_COLOR).fontSize(11).font('Helvetica');
}

function renderSubHeader(title) {
    doc.moveDown(1);
    doc.fillColor(PRIMARY_COLOR).fontSize(16).font('Helvetica-Bold').text(title);
    doc.moveDown(0.5);
    doc.fillColor(TEXT_COLOR).fontSize(11).font('Helvetica');
}

// Table of Contents
renderHeader('TABLE OF CONTENTS');
const toc = [
    '1. EXECUTIVE SUMMARY',
    '2. PROJECT OVERVIEW',
    '3. TECHNOLOGY STACK',
    '4. SYSTEM ARCHITECTURE',
    '5. ROLE-BASED MODULES',
    '6. CORE ALGORITHMS',
    '7. DATA MODEL',
    '8. API REFERENCE',
    '9. REPORTS & EXPORTS',
    '10. COMMUNICATIONS',
    '11. CURRENT STATUS — WHAT\'S WORKING',
    '12. WHAT\'S NOT FULLY WORKING / LIMITATIONS',
    '13. FUTURE WORK',
    '14. DEMO ACCOUNTS',
    '15. LOCAL DEVELOPMENT SETUP'
];

toc.forEach(item => {
    doc.text(item);
    doc.moveDown(0.5);
});

doc.addPage();

// 1. EXECUTIVE SUMMARY
renderHeader('1. EXECUTIVE SUMMARY');
doc.text('Campus Here is a full-stack, role-based web platform for managing academic project cycles at BMSIT\'s CSE department. It handles the complete lifecycle from student roster import to final reviews and report exports. Built with Next.js 16, React 19, TypeScript, PostgreSQL 17, and Prisma 7. Every feature (30+ screens) is wired to real API routes, real JWT auth, and real database writes — nothing renders sample data.', { align: 'justify' });
doc.moveDown(2);

// 2. PROJECT OVERVIEW
renderHeader('2. PROJECT OVERVIEW');
doc.font('Helvetica-Bold').text('Purpose:').font('Helvetica').text(' Manage BMSIT CSE major project cycles — group formation, title originality checking, guide allocation, review scheduling, and reporting.', { align: 'justify' });
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Target Users:').font('Helvetica').text(' Coordinator/Admin, Faculty (Guides), Students.', { align: 'justify' });
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Key Stats from Live Database:').font('Helvetica').text(' 341 users total, 300 students, 40 faculty, 71 groups, 70 titles, 3 project cycles.', { align: 'justify' });
doc.moveDown(2);

// 3. TECHNOLOGY STACK
renderHeader('3. TECHNOLOGY STACK');
const techStack = [
    { k: 'Framework', v: 'Next.js 16 (App Router) + React 19 + TypeScript' },
    { k: 'Styling', v: 'Tailwind CSS v4' },
    { k: 'Animation/Icons', v: 'Framer Motion · Lucide' },
    { k: 'Database', v: 'PostgreSQL 17' },
    { k: 'ORM', v: 'Prisma 7 with @prisma/adapter-pg driver' },
    { k: 'Auth', v: 'JWT (jose, HS256) in HTTP-only cookies, bcrypt hashing' },
    { k: 'Email/WhatsApp', v: 'Nodemailer · Twilio' },
    { k: 'Reports', v: 'ExcelJS (.xlsx)' },
    { k: 'Tests', v: 'Vitest (121 unit + 134 API-level + 23 browser tests)' },
    { k: 'Hosting', v: 'Vercel' }
];

techStack.forEach(item => {
    doc.font('Helvetica-Bold').text(`${item.k}: `).moveUp().font('Helvetica').text(`\t\t\t${item.v}`);
    doc.moveDown(0.5);
});
doc.addPage();

// 4. SYSTEM ARCHITECTURE
renderHeader('4. SYSTEM ARCHITECTURE');
renderSubHeader('4.1 Layered Architecture');
doc.list([
    'Presentation Layer: Next.js App Router pages, React 19 server/client components',
    'API Layer: Next.js API routes (/api/*), role-gated via JWT middleware',
    'Service Layer: Pure TypeScript modules for business logic (allocation, similarity, reports)',
    'Database Layer: PostgreSQL 17 via Prisma 7 ORM',
    'Auth Layer: HTTP-only JWT cookies (8-hour sessions), bcrypt password hashing'
]);

renderSubHeader('4.2 Security Model');
doc.list([
    'Two-layer security: proxy.ts middleware + requireApi()/requirePage() inside every handler',
    'HTTP-only SameSite=Lax cookies (ch_session)',
    'Constant-time error responses for login (enumeration prevention)',
    'SHA-256 hashed reset tokens, 30-minute expiry, single-use',
    'AES-256-GCM encryption for per-faculty SMTP credentials'
]);

renderSubHeader('4.3 URL Structure');
doc.list([
    '/ — Public landing page',
    '/login — Authentication',
    '/admin/* — Coordinator dashboard and management',
    '/student/* — Student workspace',
    '/faculty/* — Faculty (guide) workspace',
    '/api/* — 21 API namespaces'
]);

doc.addPage();

// 5. ROLE-BASED MODULES
renderHeader('5. ROLE-BASED MODULES');
renderSubHeader('5.1 COORDINATOR (ADMIN) MODULE');
doc.text('Access: /admin');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Pages:').font('Helvetica');
const adminPages = [
    'Admin Dashboard: Cycle-wide stats (students enrolled, groups, allocations, guides)',
    'Data Ingestion (/admin/imports): Upload student CSV, faculty CSV, title corpus with validate-then-apply workflow',
    'Student Registry (/admin/students): View/manage all enrolled students',
    'Faculty Registry (/admin/faculty): Manage guides, capacity, domains',
    'Group Management (/admin/groups): View all groups and their status',
    'Title Registry (/admin/titles): View all submitted titles with similarity scores',
    'Allocation (/admin/allocation): Preview and commit Gale-Shapley guide matching',
    'Reviews & Scheduling (/admin/reviews): Book R0/P1/P2 review sessions',
    'Attendance & Evaluation (/admin/attendance): View all attendance records',
    'Calendar & Reminders (/admin/calendar): Upload academic calendar PDF, generate reminders',
    'Mail Center (/admin/mail): Send bulk emails to role-scoped recipients',
    'Orientation (/admin/orientation): Post text or audio guidance',
    'Reports (/admin/reports): Download 9 formatted Excel workbooks',
    'Settings (/admin/settings): Manage domains, capacity rules, cycle configuration'
];
doc.list(adminPages);

renderSubHeader('5.2 STUDENT MODULE');
doc.text('Access: /student');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Pages:').font('Helvetica');
const studentPages = [
    'Student Dashboard: Group status, average CGPA, pending invites, upcoming reviews, orientation posts',
    'Invites (/student/invites): Create group, invite teammates, accept/reject invitations',
    'My Group (/student/my-group): Five-item checklist before submission, group details',
    'Domain & Title (/student/domain): Choose domain, type title with live similarity scoring',
    'Guide Preferences (/student/preferences): Rank 6 guides in order',
    'Review Timeline (/student/timeline): R0→P1→P2 review history with scores',
    'Reminders (/student/reminders): Calendar-generated review alerts',
    'Notifications (/student/notifications): In-app inbox with SSE + polling'
];
doc.list(studentPages);

renderSubHeader('5.3 FACULTY (GUIDE) MODULE');
doc.text('Access: /faculty');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Pages:').font('Helvetica');
const facultyPages = [
    'Faculty Dashboard: Assigned groups summary, upcoming sessions',
    'Assigned Groups (/faculty/assigned): Groups allocated, member contact details, roster export',
    'Review Sessions (/faculty/review-sessions): Schedule of R0/P1/P2 sessions',
    'Mark Attendance (/faculty/mark-attendance): Toggle per-student present/absent',
    'Evaluate Groups (/faculty/evaluate): Score out of 10 with remarks per phase',
    'Title Approval (/faculty/title-approval): Approve or reject submitted titles with similarity context',
    'Mail Center (/faculty/mail): Email students in assigned groups',
    'Orientation (/faculty/orientation): Post/delete text and audio briefings'
];
doc.list(facultyPages);

doc.addPage();

// 6. CORE ALGORITHMS
renderHeader('6. CORE ALGORITHMS');
renderSubHeader('6.1 Title Originality — TF-IDF + Lexical Signals');
doc.font('Helvetica-Bold').text('Pipeline:').font('Helvetica');
doc.list([
    'Lowercase + strip punctuation',
    'Expand multi-word synonyms (word-boundary anchored)',
    'Expand abbreviations (ML→machine learning, IoT→internet of things)',
    'Drop stopwords and academic filler (smart, system, application, using, based, automated)',
    'Strip plurals'
]);
doc.moveDown(1);
doc.font('Helvetica-Bold').text('Scoring Formula:');
doc.font('Courier').text('score = 0.65 × TF-IDF_cosine + 0.35 × max(dice, containment, 3-gram_jaccard, levenshtein)');
doc.moveDown(1);
doc.font('Helvetica-Bold').text('Bands:').font('Helvetica');
doc.list([
    '≥ 0.95: BLOCKED (save disabled, API returns 409)',
    '0.80–0.94: WARNING (allowed but flagged, guide sees score)',
    '< 0.80: ALLOWED (no flag)'
]);
doc.moveDown(1);
doc.text('Override: When both titles reduce to the same token set → score forced to 1.00');
doc.moveDown(1);
doc.font('Helvetica-Bold').text('Worked Example:').font('Helvetica');
doc.list([
    'Candidate: \'Smart Attendance Face Recognition\'',
    'Corpus: \'Smart Attendance via Face Recognition\'',
    'Both → {attendance, face, recognition} → Score 1.00 → BLOCKED'
]);

renderSubHeader('6.2 Guide Allocation — Gale-Shapley Stable Matching');
doc.text('Groups propose down 6 ranked preferences. Guide tie-break order:');
doc.list([
    'Domain match (guide teaches group\'s domain)',
    'Higher group average CGPA',
    'Earlier preference submission timestamp',
    'Group code ascending (deterministic final tiebreak)'
]);
doc.moveDown(1);
doc.text('Properties: Stable (verified by findBlockingPair()), Proposer-optimal, Deterministic');
doc.moveDown(1);
doc.font('Helvetica-Bold').text('Live result on seeded cohort (55 groups, 40 guides at capacity 2):').font('Helvetica');
doc.list([
    'Allocated: 55/55 (100%)',
    'Choice #1: 43 groups (78%), #2: 6 groups, #3: 5 groups, #4: 1 group',
    'Proposals made: 74 (only 19 more than 55 first choices)',
    'Stable: Yes (no blocking pair found)'
]);

doc.addPage();

// 7. DATA MODEL
renderHeader('7. DATA MODEL');
doc.text('26 database models. Key models:');
doc.list([
    'User, Student, Faculty — identity and authentication',
    'ProjectCycle, StudentCycle — cycle management and enrollment',
    'Group, GroupMember, GroupInvite — group formation with DB-enforced constraints',
    'GuidePreference — ranked preference list (max 6 per group)',
    'ProjectTitle — title with similarity scores and approval status',
    'Allocation, AllocationRun — guide assignment and audit trail',
    'ReviewSession, Attendance, Evaluation — review cycle management',
    'CalendarImport, CalendarEvent, Reminder — academic calendar integration',
    'EmailMessage, Notification, WhatsAppMessage — multi-channel communications',
    'Domain, CapacityRule, UploadedFile, ImportBatch — master data'
]);
doc.moveDown(1);
doc.font('Helvetica-Bold').text('Key Database Invariants:').font('Helvetica');
doc.list([
    'One active group per student per cycle: @@unique([cycleId, studentId]) on GroupMember',
    'No duplicate guide in preference ranks: @@unique([groupId, facultyId]) on GuidePreference',
    'Group never exceeds size: members + pending invites <= groupSize (serializable transaction)'
]);
doc.addPage();

// 8. API REFERENCE
renderHeader('8. API REFERENCE');
doc.text('21 API namespaces with routes:');
doc.list([
    '/api/auth: login, logout, me, forgot-password, reset-password',
    '/api/students: upload, list, delete, available',
    '/api/faculty: upload, list, patch',
    '/api/groups: CRUD, invite, leave, submit, preferences',
    '/api/invites: list, accept, reject',
    '/api/titles: check, import, CRUD, review',
    '/api/allocation: run (preview + commit), manual, list, runs history',
    '/api/reviews: schedule, list',
    '/api/attendance: mark, export',
    '/api/evaluation: score, list',
    '/api/calendar: import PDF, events, detect dates',
    '/api/reminders: generate, list',
    '/api/mail: send, history, config (SMTP)',
    '/api/whatsapp: send',
    '/api/notifications: inbox, SSE stream, mark-read',
    '/api/orientation: post, list, delete',
    '/api/reports: export (9 types)',
    '/api/settings: domains, capacity rules',
    '/api/cron: reminders dispatcher',
    '/api/samples: CSV templates',
    '/api/health: connectivity check'
]);
doc.addPage();

// 9. REPORTS & EXPORTS
renderHeader('9. REPORTS & EXPORTS');
doc.text('9 Excel (.xlsx) reports via ExcelJS:');
doc.list([
    '1. Student roster (300 rows with USN, name, email, CGPA)',
    '2. Group list with members and titles',
    '3. Allocation report (group <-> guide mapping)',
    '4. Cumulative attendance',
    '5. Per-session attendance',
    '6. Evaluation scores',
    '7. Reminder schedule',
    '8. Faculty load',
    '9. Title registry with similarity scores'
]);
doc.moveDown(1);
doc.text('Each report has: bold/filled/frozen header row, autofilter, sized columns, About sheet (who generated it, when, scope, row count).');
doc.text('Scope is session-derived — faculty only see their own groups, scope=admin in query is ignored.');
doc.moveDown(2);

// 10. COMMUNICATIONS
renderHeader('10. COMMUNICATIONS');
doc.list([
    'Email: Nodemailer + SMTP. Dry-run by default (MAIL_DRY_RUN=true). Recipients resolved server-side. All BCC\'d.',
    'WhatsApp: Twilio. Dry-run by default. DRY_RUN rows persisted in DB.',
    'Per-faculty SMTP credentials: AES-256-GCM encrypted at rest, never returned by API.',
    'Student inbox: SSE (real-time) + polling fallback (?since=) for missed messages.'
]);
doc.addPage();

// 11. CURRENT STATUS — WHAT'S WORKING
renderHeader('11. CURRENT STATUS — WHAT\'S WORKING');
renderSubHeader('FULLY WORKING (with live database)');

doc.font('Helvetica-Bold').fillColor(GREEN_TICK).text('V', {continued: true}).fillColor(TEXT_COLOR).text(' Authentication & RBAC:').font('Helvetica');
doc.list([
    'Login for all 3 roles (Admin, Student, Faculty)',
    'JWT sessions (HTTP-only cookies, 8-hour expiry)',
    'Password reset flow (email token, 30-min expiry, single-use)',
    'Route protection (proxy.ts + server-side RBAC)',
    'Account lockout (disabled accounts refuse login)'
]);
doc.moveDown(1);

doc.font('Helvetica-Bold').fillColor(GREEN_TICK).text('V', {continued: true}).fillColor(TEXT_COLOR).text(' Admin Module:').font('Helvetica');
doc.list([
    'CSV import for students and faculty (validate-then-apply, per-row error reporting)',
    'Title corpus import',
    'Student/Faculty registry with search and filtering',
    'Domain and capacity settings management',
    'Gale-Shapley allocation (preview dry-run + commit)',
    'Manual allocation override',
    'Allocation run history',
    'Review session scheduling with conflict detection',
    'Academic calendar PDF text extraction',
    'Reminder generation (15-day and 7-day windows at 09:00 IST)',
    'Bulk email sending',
    'WhatsApp messaging (dry-run)',
    'Orientation post/delete',
    'All 9 Excel report exports',
    'Attendance & evaluation admin view'
]);
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(GREEN_TICK).text('V', {continued: true}).fillColor(TEXT_COLOR).text(' Student Module:').font('Helvetica');
doc.list([
    'Group creation',
    'Invite-based membership (send, accept, reject with auto-decline of others)',
    'Domain selection',
    'Title submission with live TF-IDF similarity scoring',
    'Title block enforcement (server-side re-check at save)',
    'Guide preference ranking (6 choices)',
    'Group submission and locking',
    'Review timeline view',
    'Reminder view',
    'Notification inbox (SSE + polling)'
]);
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(GREEN_TICK).text('V', {continued: true}).fillColor(TEXT_COLOR).text(' Faculty Module:').font('Helvetica');
doc.list([
    'Assigned groups view with member details',
    'Review session schedule',
    'Attendance marking (per-session)',
    'Group evaluation (score + remarks)',
    'Title approval/rejection with similarity context',
    'Mail center (BCC to own students only)',
    'Orientation post/delete (author-enforced)',
    'Excel exports (assigned groups, attendance, evaluations, titles)'
]);
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(GREEN_TICK).text('V', {continued: true}).fillColor(TEXT_COLOR).text(' Testing:').font('Helvetica');
doc.list([
    '121 unit tests (Vitest) covering similarity, allocation, CSV validators, PDF detection, AES',
    '134 API-level feature tests across 6 suites',
    '23 browser-driven E2E tests'
]);

doc.addPage();

// 12. WHAT'S NOT FULLY WORKING / LIMITATIONS
renderHeader('12. WHAT\'S NOT FULLY WORKING / LIMITATIONS');
doc.font('Helvetica-Bold').fillColor(AMBER_WARN).text('! ', {continued: true}).fillColor(TEXT_COLOR).text('TypeScript Type Errors (non-breaking): ').font('Helvetica').text('13 TypeScript compilation errors in src/app routes (TS2304: Cannot find name \'PageProps\', \'LayoutProps\', \'RouteContext\'). These are type declaration issues only — the application runs and all features work at runtime.');
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(AMBER_WARN).text('! ', {continued: true}).fillColor(TEXT_COLOR).text('Live Email & WhatsApp: ').font('Helvetica').text('Email and WhatsApp are in DRY_RUN mode by default. No emails actually leave the server unless MAIL_DRY_RUN=false and real SMTP/Twilio credentials are configured in .env.');
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(AMBER_WARN).text('! ', {continued: true}).fillColor(TEXT_COLOR).text('Hydration Warning (cosmetic): ').font('Helvetica').text('A minor React hydration warning exists on the landing page (dark/light mode toggle aria-label differs between SSR and client).');
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(AMBER_WARN).text('! ', {continued: true}).fillColor(TEXT_COLOR).text('SSE on Serverless: ').font('Helvetica').text('Server-Sent Events (real-time notifications) are terminated when the Vercel function hits its execution limit. The fallback polling mechanism (?since=) guarantees no messages are missed.');
doc.moveDown(1);
doc.font('Helvetica-Bold').fillColor(AMBER_WARN).text('! ', {continued: true}).fillColor(TEXT_COLOR).text('File Storage: ').font('Helvetica').text('Uploaded files (PDFs, audio, CSVs) are stored as bytea in PostgreSQL rather than a dedicated file store.');
doc.moveDown(2);

// 13. FUTURE WORK
renderHeader('13. FUTURE WORK');
renderSubHeader('Short-term (Ready for implementation)');
doc.list([
    '1. Fix TypeScript type declarations (PageProps, LayoutProps, RouteContext)',
    '2. Enable live email: configure MAIL_DRY_RUN=false',
    '3. Enable live WhatsApp: configure Twilio credentials',
    '4. Resolve landing page hydration warning',
    '5. Deploy to Vercel with managed Neon/Supabase PostgreSQL',
    '6. Configure Vercel Cron for automatic reminder dispatch'
]);

renderSubHeader('Medium-term (Enhancement)');
doc.list([
    '7. File storage migration: Move uploaded files to Cloudflare R2 or AWS S3',
    '8. Student bulk password reset workflow',
    '9. Inter-cycle analytics',
    '10. Mobile-responsive improvements',
    '11. Two-factor authentication (TOTP) for Admin accounts',
    '12. Admin audit log'
]);

renderSubHeader('Long-term (Major features)');
doc.list([
    '13. Multi-department support',
    '14. Mini-project and internship cycle differentiation',
    '15. Plagiarism API integration',
    '16. Student self-registration',
    '17. AI-assisted guide recommendation',
    '18. Real-time collaborative group workspace'
]);
doc.addPage();

// 14. DEMO ACCOUNTS
renderHeader('14. DEMO ACCOUNTS');
doc.text('All seeded accounts share password: Campus@123');
doc.list([
    'Admin: admin@example.edu',
    'Faculty (example): ananya.rao@example.edu',
    'Students: USN 1BY23CS001 through 1BY23CS300 (email: same format @example.edu)'
]);
doc.moveDown(2);

// 15. LOCAL DEVELOPMENT SETUP
renderHeader('15. LOCAL DEVELOPMENT SETUP');
doc.text('Prerequisites: Node.js 20+, Docker Desktop or PostgreSQL connection');
doc.moveDown(0.5);
doc.font('Courier').fontSize(10);
doc.text('npm install                  # installs deps + runs prisma generate');
doc.text('cp .env.example .env         # then fill in values');
doc.text('docker compose up -d         # Postgres 17 on localhost:5433');
doc.text('npx prisma migrate dev       # create schema');
doc.text('npm run db:check             # verify connection');
doc.text('npx prisma db seed           # seed demo data');
doc.text('npm run dev                  # http://localhost:3000');
doc.font('Helvetica').fontSize(11).moveDown(1);
doc.font('Helvetica-Bold').text('Key environment variables:').font('Helvetica');
doc.list([
    'DATABASE_URL: PostgreSQL connection string',
    'JWT_SECRET: HS256 signing key',
    'ENCRYPTION_KEY: AES-256-GCM key for SMTP credentials',
    'APP_URL: http://localhost:3000',
    'MAIL_DRY_RUN: true (set false for real email)',
    'SEED_PASSWORD: Campus@123'
]);

// Finalize PDF file
doc.end();
console.log('PDF documentation generated successfully.');
