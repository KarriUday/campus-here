"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Hash,
  LockKeyhole,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

type Step = "request" | "verify" | "pending";

export function SignupForm() {
  const router = useRouter();

  // IDs
  const emailId = useId();
  const usnId = useId();
  const codeId = useId();
  const passwordId = useId();
  const confirmId = useId();

  // Step state
  const [step, setStep] = useState<Step>("request");

  // Field values
  const [email, setEmail] = useState("");
  const [usn, setUsn] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown(seconds = 60) {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function onRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usn }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setStep("verify");
      startCooldown(60);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usn }),
      });
      startCooldown(60);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usn, code, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      if (data.pendingApproval) {
        setStep("pending");
        return;
      }
      router.replace(data.redirectTo ?? "/student");
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
        Create your account
      </p>

      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-[#242157] sm:text-[2.5rem]">
        <Reveal mode="mount">
          {step === "request"
            ? "Sign up for Campus Here"
            : step === "verify"
              ? "Verify your email"
              : "Account Registered"}
        </Reveal>
      </h1>

      {step !== "pending" && (
        <p className="mt-4 max-w-md text-sm leading-6 text-[#686977]">
          {step === "request"
            ? "Enter your college email and USN. We'll send a one-time code to verify your identity."
            : `We sent a 6-digit code to ${email}. Enter it below to activate your account.`}
        </p>
      )}

      {/* Step indicator */}
      {step !== "pending" && (
        <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
              step === "request"
                ? "bg-[#28265f] text-white"
                : "bg-[#22c55e] text-white"
            }`}
          >
            {step === "verify" ? <CheckCircle2 className="size-3.5" /> : "1"}
          </span>
          <span
            className={`text-xs font-semibold ${step === "request" ? "text-[#28265f]" : "text-[#22c55e]"}`}
          >
            Identify
          </span>
        </div>
        <span className="h-px w-6 bg-[#d8d9e2]" />
        <div className="flex items-center gap-1.5">
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
              step === "verify"
                ? "bg-[#28265f] text-white"
                : "bg-[#d8d9e2] text-[#888]"
            }`}
          >
            2
          </span>
          <span
            className={`text-xs font-semibold ${step === "verify" ? "text-[#28265f]" : "text-[#aaa]"}`}
          >
            Verify &amp; Set password
          </span>
        </div>
      </div>
      )}

      {/* --- STEP 1: Request OTP --- */}
      {step === "request" && (
        <form onSubmit={onRequestOtp} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor={emailId} className="text-sm font-semibold text-[#333342]">
              College email address
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
                autoComplete="email"
                inputMode="email"
                placeholder="you@bmsit.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-13 w-full rounded-xl border border-[#d8d9e2] bg-white pr-4 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={usnId} className="text-sm font-semibold text-[#333342]">
              University Seat Number (USN)
            </label>
            <div className="group relative">
              <Hash
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]"
                aria-hidden="true"
              />
              <input
                id={usnId}
                type="text"
                name="usn"
                autoComplete="off"
                placeholder="1BY23CS001"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                required
                className="h-13 w-full rounded-xl border border-[#d8d9e2] bg-white pr-4 pl-11 text-sm font-mono uppercase text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] placeholder:normal-case hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#888997]">
              Your USN must match the record imported by your department coordinator.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#f0c7ca] bg-[#fff4f4] px-4 py-3 text-sm leading-5 text-[#9f242b]">
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
            Send OTP
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>

          <p className="text-center text-sm text-[#686977]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#28265f] hover:text-[#1d1b48]">
              Sign in
            </Link>
          </p>
        </form>
      )}

      {/* --- STEP 2: Verify OTP + Set Password --- */}
      {step === "verify" && (
        <form onSubmit={onVerify} className="mt-8 flex flex-col gap-5">
          {/* OTP Code */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor={codeId} className="text-sm font-semibold text-[#333342]">
                6-digit OTP code
              </label>
              <button
                type="button"
                onClick={onResend}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1 rounded text-xs font-semibold text-[#b9272f] transition-colors hover:text-[#8e1d24] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="size-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
            <div className="group relative">
              <input
                id={codeId}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                name="code"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                className="h-13 w-full rounded-xl border border-[#d8d9e2] bg-white px-4 text-center text-2xl font-mono font-bold tracking-[0.4em] text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] placeholder:tracking-normal placeholder:text-base hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#888997]">
              Check your inbox at <span className="font-medium text-[#333342]">{email}</span>. The code expires in 10 minutes.
              {" "}If you don&apos;t see it, check your spam folder or check the server console log.
            </p>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor={passwordId} className="text-sm font-semibold text-[#333342]">
              Choose a password
            </label>
            <div className="group relative">
              <LockKeyhole
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]"
                aria-hidden="true"
              />
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-13 w-full rounded-xl border border-[#d8d9e2] bg-white pr-12 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#777886] transition-colors hover:bg-[#f0f0f5] hover:text-[#28265f]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor={confirmId} className="text-sm font-semibold text-[#333342]">
              Confirm password
            </label>
            <div className="group relative">
              <LockKeyhole
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]"
                aria-hidden="true"
              />
              <input
                id={confirmId}
                type={showPassword ? "text" : "password"}
                name="confirm"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className={`h-13 w-full rounded-xl border bg-white pr-4 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] focus:outline-none ${
                  confirm && confirm !== password
                    ? "border-[#e04a50] focus:border-[#e04a50] focus:shadow-[0_0_0_4px_rgba(176,39,47,0.10)]"
                    : "border-[#d8d9e2] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)]"
                }`}
              />
            </div>
            {confirm && confirm !== password && (
              <p className="text-xs text-[#e04a50]">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#f0c7ca] bg-[#fff4f4] px-4 py-3 text-sm leading-5 text-[#9f242b]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            magnetic={false}
            disabled={code.length < 6 || !password || password !== confirm}
            className="mt-1 h-13 w-full rounded-xl border-[#28265f] bg-[#28265f] text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(40,38,95,0.72)] hover:border-[#1d1b48] hover:bg-[#1d1b48] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Create Account
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("request"); setError(null); setCode(""); }}
            className="text-center text-sm text-[#686977] hover:text-[#28265f] underline"
          >
            ← Go back and change email
          </button>
        </form>
      )}

      {/* --- STEP 3: Pending Admin Approval --- */}
      {step === "pending" && (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#fef3c7] text-[#d97706] shadow-sm">
            <Clock className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#242157]">
            Registration Submitted!
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#686977]">
            Your student account (<span className="font-semibold text-[#242157]">{usn}</span>) has been created successfully.
          </p>
          <div className="mt-6 w-full rounded-2xl border border-[#fed7aa] bg-[#fffbeb] p-5 text-left text-sm text-[#92400e]">
            <p className="font-bold flex items-center gap-2 text-base text-[#b45309]">
              <span>⚠️</span> Awaiting Administrator Approval
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#78350f]">
              An administrator must verify and approve your registration before your account is activated. Once approved by the department coordinator, you will be able to sign in with your email and password.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 flex h-13 w-full items-center justify-center rounded-xl bg-[#28265f] text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(40,38,95,0.72)] transition-colors hover:bg-[#1d1b48]"
          >
            Back to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
