"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  userId?: string | null;
  initialStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export function StudentApprovalAction({ userId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  if (!userId) {
    return <Badge tone="neutral">No Account</Badge>;
  }

  async function handleAction(action: "APPROVE" | "REJECT") {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        setStatus(action === "APPROVE" ? "APPROVED" : "REJECTED");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "APPROVED") {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="success">Approved</Badge>
        <button
          type="button"
          onClick={() => handleAction("REJECT")}
          disabled={loading}
          title="Reject / Disable account"
          className="text-xs text-neutral-400 hover:text-rose-600 transition-colors px-1 py-0.5 rounded cursor-pointer"
        >
          Revoke
        </button>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="error">Rejected</Badge>
        <button
          type="button"
          onClick={() => handleAction("APPROVE")}
          disabled={loading}
          title="Approve account"
          className="text-xs text-emerald-600 font-medium hover:underline transition-colors px-1 py-0.5 rounded cursor-pointer"
        >
          Approve
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge tone="warning">Pending</Badge>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleAction("APPROVE")}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          title="Approve student registration"
        >
          <Check className="size-3" /> Approve
        </button>
        <button
          type="button"
          onClick={() => handleAction("REJECT")}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          title="Reject student registration"
        >
          <X className="size-3" /> Reject
        </button>
      </div>
    </div>
  );
}
