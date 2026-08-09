"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#b9272f] uppercase">
        <span className="h-px w-7 bg-[#b9272f]" aria-hidden="true" />
        Welcome back
      </p>

      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-[#242157] sm:text-[2.5rem]">
        <Reveal mode="mount">Sign in to Campus Here</Reveal>
      </h1>

      <p className="mt-4 max-w-md text-sm leading-6 text-[#686977]">
        Enter the BMSIT account issued by your department. We&apos;ll take you
        straight to your assigned workspace.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={emailId} className="text-sm font-semibold text-[#333342]">
            Email address
          </label>
          <div className="group relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]"
              aria-hidden="true"
            />
            <input
              id={emailId}
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              placeholder="you@bmsit.in"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-13 w-full rounded-xl border border-[#d8d9e2] bg-white pr-4 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor={passwordId}
              className="text-sm font-semibold text-[#333342]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="rounded text-xs font-semibold text-[#b9272f] transition-colors hover:text-[#8e1d24]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="group relative">
            <LockKeyhole
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]"
              aria-hidden="true"
            />
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-13 w-full rounded-xl border border-[#d8d9e2] bg-white pr-12 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#777886] transition-colors hover:bg-[#f0f0f5] hover:text-[#28265f]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-[#f0c7ca] bg-[#fff4f4] px-4 py-3 text-sm leading-5 text-[#9f242b]"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          magnetic={false}
          className="mt-1 h-13 w-full rounded-xl border-[#28265f] bg-[#28265f] text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(40,38,95,0.72)] hover:border-[#1d1b48] hover:bg-[#1d1b48]"
        >
          Sign in
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#e2e2e9] bg-white px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#28265f]" aria-hidden="true" />
        <p className="text-xs leading-5 text-[#747582]">
          Your access is protected and matched automatically to your student,
          faculty or coordinator role.
        </p>
      </div>
    </div>
  );
}
