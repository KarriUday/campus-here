"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Reveal } from "@/components/motion/reveal";

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
    <div>
      <p className="label-xs text-ink-tertiary mb-5">[01] &nbsp; Access</p>

      <Reveal mode="mount">
        <h1 className="display text-5xl sm:text-6xl">Sign in</h1>
      </Reveal>

      <p className="text-ink-secondary border-border-subtle mt-5 border-b pb-6 text-sm leading-relaxed">
        Use the account issued by your department. Roles are resolved on the
        server — you land on your own section.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-7">
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
            className="border-primary text-primary label-xs border-l-2 py-2 pl-3"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          magnetic={false}
          className="w-full"
        >
          Sign in →
        </Button>
      </form>

      <div className="border-border-subtle mt-8 border-t pt-5">
        <Link
          href="/forgot-password"
          className="label-xs text-ink-tertiary hover:text-primary transition-colors"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
