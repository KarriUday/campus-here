"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      // Only follow `next` when it is a same-site path, so the parameter
      // cannot be used to bounce someone to another origin after login.
      const next = searchParams.get("next");
      const target =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : data.redirectTo;
      router.replace(target);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <h1 className="text-ink text-lg font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-ink-secondary mt-1 text-sm">
          Use the account issued by your department.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@bmsit.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p
              role="alert"
              className="bg-error-soft text-error-ink rounded-lg px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-ink-secondary hover:text-primary rounded text-sm transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
