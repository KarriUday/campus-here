"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

type RoleType = "STUDENT" | "FACULTY" | "ADMIN";
type LoginMode = "password" | "otp-request" | "otp-verify";

const ROLE_CONFIG: Record<
  RoleType,
  {
    label: string;
    badge: string;
    icon: typeof GraduationCap;
    defaultEmail: string;
    description: string;
    accentColor: string;
  }
> = {
  STUDENT: {
    label: "Student",
    badge: "Project Team",
    icon: GraduationCap,
    defaultEmail: "1by23cs098@bmsit.in",
    description: "Manage group, project titles, guide preferences & review timeline",
    accentColor: "#28265f",
  },
  FACULTY: {
    label: "Faculty",
    badge: "Project Guide",
    icon: BookOpen,
    defaultEmail: "ananya.rao@example.edu",
    description: "Review assigned groups, evaluate milestones & mark attendance",
    accentColor: "#0284c7",
  },
  ADMIN: {
    label: "Admin",
    badge: "Coordinator",
    icon: ShieldCheck,
    defaultEmail: "admin@example.edu",
    description: "Manage project cycles, roster imports, allocation engine & reports",
    accentColor: "#b9272f",
  },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailId = useId();
  const passwordId = useId();
  const codeId = useId();

  const [selectedRole, setSelectedRole] = useState<RoleType>("STUDENT");
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleRoleChange(role: RoleType) {
    setSelectedRole(role);
    setError(null);
  }

  function handleAutoFill(role: RoleType) {
    setSelectedRole(role);
    setEmail(ROLE_CONFIG[role].defaultEmail);
    setPassword("Campus@123");
    setError(null);
  }

  function startCooldown(seconds = 60) {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function handleRedirect(redirectTo: string) {
    const next = searchParams.get("next");
    const target =
      next && next.startsWith("/") && !next.startsWith("//") ? next : redirectTo;
    router.replace(target);
    router.refresh();
  }

  // --- Password login ---
  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
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
      if (!res.ok) { setError(data.error ?? "Sign in failed."); return; }
      handleRedirect(data.redirectTo);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // --- OTP: Request ---
  async function onOtpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to send OTP."); return; }
      setMode("otp-verify");
      startCooldown(60);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // --- OTP: Verify ---
  async function onOtpVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed."); return; }
      handleRedirect(data.redirectTo);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await fetch("/api/auth/login/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      startCooldown(60);
    } finally {
      setLoading(false);
    }
  }

  const activeRole = ROLE_CONFIG[selectedRole];

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#b9272f] uppercase">
        <span className="h-px w-7 bg-[#b9272f]" aria-hidden="true" />
        Welcome back
      </p>

      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-[#242157] sm:text-[2.5rem]">
        <Reveal mode="mount">Sign in to Campus Here</Reveal>
      </h1>

      <p className="mt-2 text-sm leading-6 text-[#686977]">
        Select your role below to access your dedicated workspace.
      </p>

      {/* --- ROLE SELECTOR TABS --- */}
      <div className="mt-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#717182]">
          Sign in as:
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["STUDENT", "FACULTY", "ADMIN"] as RoleType[]).map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  isSelected
                    ? "border-[#28265f] bg-[#28265f] text-white shadow-md shadow-[#28265f]/15 ring-2 ring-[#28265f]/20"
                    : "border-[#e2e2e9] bg-white text-[#4f5060] hover:border-[#b6b7c4] hover:bg-[#f8f8fc]"
                }`}
              >
                <Icon
                  className={`size-5 transition-transform ${isSelected ? "scale-110 text-[#ffcbce]" : "text-[#717182]"}`}
                />
                <span className="text-xs font-bold leading-none">{config.label}</span>
                <span
                  className={`text-[0.62rem] font-medium leading-none ${
                    isSelected ? "text-white/80" : "text-[#8e8f9e]"
                  }`}
                >
                  {config.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Quick-Hint banner & autofill helper */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-[#e5e5ec] bg-[#f8f9fc] px-3.5 py-2 text-xs text-[#525363]">
        <div className="flex items-center gap-2">
          <UserCheck className="size-3.5 text-[#28265f]" />
          <span>
            Signing in as <strong>{activeRole.label}</strong> ({activeRole.badge})
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleAutoFill(selectedRole)}
          className="flex items-center gap-1 text-[0.7rem] font-semibold text-[#b9272f] hover:underline"
        >
          <Sparkles className="size-3" />
          Fill demo
        </button>
      </div>

      {/* Authentication Mode Tabs: Password vs OTP */}
      {mode !== "otp-verify" && (
        <div className="mt-5 flex gap-1 rounded-xl border border-[#e2e2e9] bg-[#f5f5fa] p-1">
          <button
            type="button"
            onClick={() => { setMode("password"); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === "password"
                ? "bg-white text-[#28265f] shadow-sm"
                : "text-[#888997] hover:text-[#28265f]"
            }`}
          >
            <LockKeyhole className="size-3.5" />
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode("otp-request"); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === "otp-request"
                ? "bg-white text-[#28265f] shadow-sm"
                : "text-[#888997] hover:text-[#28265f]"
            }`}
          >
            <KeyRound className="size-3.5" />
            Login with OTP
          </button>
        </div>
      )}

      {/* --- PASSWORD LOGIN --- */}
      {mode === "password" && (
        <form onSubmit={onPasswordSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-xs font-semibold text-[#333342]">
              {selectedRole === "STUDENT" ? "Student Email or USN" : `${activeRole.label} Email`}
            </label>
            <div className="group relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]" aria-hidden="true" />
              <input
                id={emailId}
                type="text"
                name="email"
                autoComplete="username"
                placeholder={selectedRole === "STUDENT" ? "1by23cs098@bmsit.in or USN" : activeRole.defaultEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-[#d8d9e2] bg-white pr-4 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor={passwordId} className="text-xs font-semibold text-[#333342]">
                Password
              </label>
              <Link href="/forgot-password" className="rounded text-xs font-semibold text-[#b9272f] transition-colors hover:text-[#8e1d24]">
                Forgot password?
              </Link>
            </div>
            <div className="group relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]" aria-hidden="true" />
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-[#d8d9e2] bg-white pr-12 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#777886] transition-colors hover:bg-[#f0f0f5] hover:text-[#28265f]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#f0c7ca] bg-[#fff4f4] px-4 py-2.5 text-xs leading-5 text-[#9f242b]">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} magnetic={false}
            className="mt-1 h-12 w-full rounded-xl border-[#28265f] bg-[#28265f] text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(40,38,95,0.72)] hover:border-[#1d1b48] hover:bg-[#1d1b48]">
            Sign in as {activeRole.label}
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>

          {selectedRole === "STUDENT" && (
            <p className="text-center text-xs text-[#686977]">
              New student?{" "}
              <Link href="/signup" className="font-semibold text-[#28265f] hover:text-[#1d1b48]">
                Create your account
              </Link>
            </p>
          )}
        </form>
      )}

      {/* --- OTP REQUEST --- */}
      {mode === "otp-request" && (
        <form onSubmit={onOtpRequest} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-xs font-semibold text-[#333342]">
              {selectedRole === "STUDENT" ? "Student Email or USN" : `${activeRole.label} Email`}
            </label>
            <div className="group relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#888997] transition-colors group-focus-within:text-[#28265f]" aria-hidden="true" />
              <input
                id={emailId}
                type="text"
                name="email"
                autoComplete="email"
                placeholder={selectedRole === "STUDENT" ? "1by23cs098@bmsit.in or USN" : activeRole.defaultEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-[#d8d9e2] bg-white pr-4 pl-11 text-sm text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#f0c7ca] bg-[#fff4f4] px-4 py-2.5 text-xs leading-5 text-[#9f242b]">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} magnetic={false}
            className="mt-1 h-12 w-full rounded-xl border-[#28265f] bg-[#28265f] text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(40,38,95,0.72)] hover:border-[#1d1b48] hover:bg-[#1d1b48]">
            Send OTP to {activeRole.label}
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>

          {selectedRole === "STUDENT" && (
            <p className="text-center text-xs text-[#686977]">
              New student?{" "}
              <Link href="/signup" className="font-semibold text-[#28265f] hover:text-[#1d1b48]">
                Create your account
              </Link>
            </p>
          )}
        </form>
      )}

      {/* --- OTP VERIFY --- */}
      {mode === "otp-verify" && (
        <form onSubmit={onOtpVerify} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={codeId} className="text-xs font-semibold text-[#333342]">
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
              className="h-12 w-full rounded-xl border border-[#d8d9e2] bg-white px-4 text-center text-2xl font-mono font-bold tracking-[0.4em] text-[#242431] shadow-[0_1px_2px_rgba(24,23,57,0.03)] transition-[border-color,box-shadow] placeholder:text-[#a2a3ad] placeholder:tracking-normal placeholder:text-base hover:border-[#b6b7c4] focus:border-[#302c70] focus:shadow-[0_0_0_4px_rgba(48,44,112,0.10)] focus:outline-none"
            />
            <p className="text-[0.7rem] text-[#888997]">
              Code sent to <span className="font-medium text-[#333342]">{email}</span>. Check server console / <code className="text-[#28265f]">.latest-otp.json</code>.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#f0c7ca] bg-[#fff4f4] px-4 py-2.5 text-xs leading-5 text-[#9f242b]">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} magnetic={false}
            disabled={code.length < 6}
            className="mt-1 h-12 w-full rounded-xl border-[#28265f] bg-[#28265f] text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(40,38,95,0.72)] hover:border-[#1d1b48] hover:bg-[#1d1b48] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
            Verify & Sign in
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>

          <button
            type="button"
            onClick={() => { setMode("otp-request"); setError(null); setCode(""); }}
            className="text-center text-xs text-[#686977] hover:text-[#28265f] underline"
          >
            ← Use a different email
          </button>
        </form>
      )}

      {mode !== "otp-verify" && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#e2e2e9] bg-white px-3.5 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#28265f]" aria-hidden="true" />
          <p className="text-[0.72rem] leading-4 text-[#747582]">
            {activeRole.description}
          </p>
        </div>
      )}
    </div>
  );
}
