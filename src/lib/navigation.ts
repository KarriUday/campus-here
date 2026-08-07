import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListOrdered,
  Mail,
  Megaphone,
  Settings,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

/**
 * Navigation density. Carried over from the prototype's Presentation/Detailed
 * toggle: "present" shows a shorter list with plainer labels for demos,
 * "detailed" shows every screen.
 */
export type NavMode = "present" | "detailed";

export type NavItem = {
  href: string;
  /** Label in detailed mode. */
  label: string;
  /** Label in presentation mode; absent means the item is hidden there. */
  presentLabel?: string;
  icon: LucideIcon;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", presentLabel: "Overview", icon: LayoutDashboard },
  { href: "/admin/imports", label: "Data Ingestion (Upload)", presentLabel: "Upload Data", icon: FileSpreadsheet },
  { href: "/admin/orientation", label: "Orientation", presentLabel: "Orientation", icon: Megaphone },
  { href: "/admin/calendar", label: "Calendar PDF → Reminders", presentLabel: "Calendar PDF", icon: CalendarDays },
  { href: "/admin/mail", label: "Mail Center", presentLabel: "Mail Center", icon: Mail },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/faculty", label: "Faculty", icon: GraduationCap },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/allocation", label: "Allocation", presentLabel: "Allocation", icon: Target },
  { href: "/admin/reviews", label: "Reviews & Scheduling", presentLabel: "Reviews & Reminders", icon: CalendarClock },
  { href: "/admin/attendance", label: "Attendance & Evaluation", icon: ClipboardCheck },
  { href: "/admin/titles", label: "Title Registry & Duplication", icon: FileText },
  { href: "/admin/reports", label: "Reports & Exports", presentLabel: "Exports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Dashboard", presentLabel: "Overview", icon: LayoutDashboard },
  { href: "/student/my-group", label: "My Group", icon: UsersRound },
  { href: "/student/invites", label: "Invites", presentLabel: "Form Group", icon: UserPlus },
  { href: "/student/domain", label: "Domain & Problem Statement", presentLabel: "Problem Statement", icon: FileText },
  { href: "/student/preferences", label: "Guide Preferences (1–6)", presentLabel: "Guide Preferences", icon: ListOrdered },
  { href: "/student/timeline", label: "Review Timeline", presentLabel: "Timeline", icon: CalendarClock },
  { href: "/student/reminders", label: "Reminders", presentLabel: "Reminders", icon: Bell },
  { href: "/student/notifications", label: "Notifications", presentLabel: "Notifications", icon: Mail },
];

const FACULTY_NAV: NavItem[] = [
  { href: "/faculty", label: "Dashboard", presentLabel: "Overview", icon: LayoutDashboard },
  { href: "/faculty/orientation", label: "Orientation", presentLabel: "Orientation", icon: Megaphone },
  { href: "/faculty/mail", label: "Mail Center", presentLabel: "Mail Center", icon: Mail },
  { href: "/faculty/assigned", label: "Assigned Groups", presentLabel: "My Groups", icon: UsersRound },
  { href: "/faculty/review-sessions", label: "Review Sessions", icon: CalendarClock },
  { href: "/faculty/mark-attendance", label: "Mark Attendance", presentLabel: "Attendance", icon: ClipboardCheck },
  { href: "/faculty/evaluate", label: "Evaluate Groups", presentLabel: "Evaluation", icon: BookOpenCheck },
  { href: "/faculty/title-approval", label: "Title Approval", icon: ShieldCheck },
];

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: ADMIN_NAV,
  STUDENT: STUDENT_NAV,
  FACULTY: FACULTY_NAV,
};

export function navItemsFor(role: Role, mode: NavMode): NavItem[] {
  const items = NAV_BY_ROLE[role];
  if (mode === "detailed") return items;
  return items.filter((item) => item.presentLabel);
}

export function navLabel(item: NavItem, mode: NavMode) {
  return mode === "present" ? (item.presentLabel ?? item.label) : item.label;
}
