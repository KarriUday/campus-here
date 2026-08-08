"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not reset the password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/login"), 1500);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card>
        <CardBody>
          <h1 className="text-ink text-lg font-semibold">Link incomplete</h1>
          <p className="text-ink-secondary mt-2 text-sm">
            This reset link is missing its token. Request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="text-primary mt-6 inline-block rounded text-sm font-medium"
          >
            Request a new link
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <h1 className="text-ink text-lg font-semibold tracking-tight">
          Choose a new password
        </h1>

        {done ? (
          <p className="text-success-ink bg-success-soft mt-4 px-3 py-2 text-sm">
            Password updated. Taking you to sign in…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
            {error && (
              <p
                role="alert"
                className="bg-error-soft text-error-ink px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
