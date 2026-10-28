import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";
import { StudentApprovalAction } from "./student-approval-action";

export const metadata: Metadata = { title: "Students" };

const PAGE_SIZE = 50;

export default async function StudentsPage({
  searchParams,
}: PageProps<"/admin/students">) {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q.trim() : "";
  const grouped = typeof params.grouped === "string" ? params.grouped : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  if (!cycle) {
    return (
      <>
        <PageHeader title="Students" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const where = {
    ...(statusFilter === "PENDING"
      ? { user: { is: { approvalStatus: "PENDING" as const } } }
      : {
          enrollments: { some: { cycleId: cycle.id } },
          ...(statusFilter === "APPROVED"
            ? { user: { is: { approvalStatus: "APPROVED" as const } } }
            : statusFilter === "REJECTED"
              ? { user: { is: { approvalStatus: "REJECTED" as const } } }
              : {}),
        }),
    ...(query
      ? {
          OR: [
            { usn: { contains: query, mode: "insensitive" as const } },
            { fullName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(grouped === "yes"
      ? { memberships: { some: { cycleId: cycle.id } } }
      : grouped === "no"
        ? { memberships: { none: { cycleId: cycle.id } } }
        : {}),
  };

  const [total, students, ungroupedCount, pendingCount] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: [{ cgpa: "desc" }, { usn: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        usn: true,
        fullName: true,
        email: true,
        phone: true,
        cgpa: true,
        user: {
          select: {
            id: true,
            approvalStatus: true,
            isActive: true,
          },
        },
        memberships: {
          where: { cycleId: cycle.id },
          select: { group: { select: { code: true, status: true } } },
        },
      },
    }),
    prisma.student.count({
      where: {
        enrollments: { some: { cycleId: cycle.id } },
        memberships: { none: { cycleId: cycle.id } },
      },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        approvalStatus: "PENDING",
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const linkFor = (next: Record<string, string | number>) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (grouped) search.set("grouped", grouped);
    if (statusFilter) search.set("status", statusFilter);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") search.delete(key);
      else search.set(key, String(value));
    }
    const qs = search.toString();
    return `/admin/students${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Search the roster and see group membership, CGPA and account approval."
        cycleName={cycle.name}
        role="Admin"
      />

      {pendingCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-lg">
              ⏳
            </span>
            <div>
              <p className="font-semibold text-sm">
                {pendingCount} student registration{pendingCount === 1 ? "" : "s"} awaiting approval
              </p>
              <p className="text-xs text-amber-700">
                Newly registered students require admin approval before they can log in.
              </p>
            </div>
          </div>
          <Link
            href="/admin/students?status=PENDING"
            className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            Review Pending ({pendingCount})
          </Link>
        </div>
      )}

      <Card>
        <CardHeader
          title={`${total} student${total === 1 ? "" : "s"}`}
          subtitle={`${ungroupedCount} not yet in a group.`}
        />
        <CardBody className="space-y-4">
          {/* A plain GET form, so search works without JavaScript and every
              result set is a shareable URL. */}
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="student-search" className="label-xs text-ink-tertiary">
                Search
              </label>
              <div className="relative mt-2">
                <Search
                  className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <input
                  id="student-search"
                  name="q"
                  defaultValue={query}
                  placeholder="USN, name or email"
                  className="border-border-subtle bg-surface-raised text-ink placeholder:text-ink-tertiary hover:border-ink-tertiary focus:border-primary h-11 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="student-grouped" className="label-xs text-ink-tertiary">
                Group status
              </label>
              <select
                id="student-grouped"
                name="grouped"
                defaultValue={grouped}
                className="border-border-subtle bg-surface-raised text-ink hover:border-ink-tertiary focus:border-primary mt-2 h-11 rounded-lg border px-3 pr-8 text-sm transition-colors"
              >
                <option value="">All students</option>
                <option value="yes">In a group</option>
                <option value="no">Not in a group</option>
              </select>
            </div>
            <div>
              <label htmlFor="student-status" className="label-xs text-ink-tertiary">
                Account status
              </label>
              <select
                id="student-status"
                name="status"
                defaultValue={statusFilter}
                className="border-border-subtle bg-surface-raised text-ink hover:border-ink-tertiary focus:border-primary mt-2 h-11 rounded-lg border px-3 pr-8 text-sm transition-colors"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover h-11 rounded-full px-6 text-sm font-medium text-white transition-colors"
            >
              Apply
            </button>
            {(query || grouped || statusFilter) && (
              <Link
                href="/admin/students"
                className="label-xs text-ink-tertiary hover:text-primary h-10 px-2 leading-10 transition-colors"
              >
                Clear
              </Link>
            )}
          </form>

          <DataTable
            rows={students}
            rowKey={(row) => row.id}
            emptyTitle={query ? "No students match that search" : "No students yet"}
            emptyDescription={
              query
                ? "Try a different USN, name or email."
                : "Upload a roster from Data Ingestion to populate this cycle."
            }
            columns={[
              {
                key: "usn",
                header: "USN",
                render: (row) => <span className="mono">{row.usn}</span>,
              },
              { key: "name", header: "Name", render: (row) => row.fullName },
              {
                key: "cgpa",
                header: "CGPA",
                numeric: true,
                render: (row) => formatCgpa(Number(row.cgpa)),
              },
              { key: "email", header: "Email", render: (row) => row.email },
              {
                key: "phone",
                header: "Phone",
                render: (row) => row.phone ?? "—",
              },
              {
                key: "group",
                header: "Group",
                render: (row) => {
                  const group = row.memberships[0]?.group;
                  return group ? (
                    <span className="mono">{group.code}</span>
                  ) : (
                    <Badge tone="warning">No group</Badge>
                  );
                },
              },
              {
                key: "approval",
                header: "Account Approval",
                render: (row) => (
                  <StudentApprovalAction
                    userId={row.user?.id}
                    initialStatus={row.user?.approvalStatus ?? "APPROVED"}
                  />
                ),
              },
            ]}
          />

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-ink-secondary text-sm">
                Page {page} of {pageCount}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={linkFor({ page: page - 1 })}
                    className="bg-surface-raised border-border-subtle hover:border-ink rounded-full border px-5 py-2 text-sm transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {page < pageCount && (
                  <Link
                    href={linkFor({ page: page + 1 })}
                    className="bg-surface-raised border-border-subtle hover:border-ink rounded-full border px-5 py-2 text-sm transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
