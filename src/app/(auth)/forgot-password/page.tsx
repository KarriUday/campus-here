"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // The endpoint answers identically whether or not the address exists,
      // so the UI must not reveal anything either.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <h1 className="text-ink text-lg font-semibold tracking-tight">
          Reset your password
        </h1>

        {sent ? (
          <>
            <p className="text-ink-secondary mt-2 text-sm">
              If that email is registered, a reset link is on its way. The link
              expires in 30 minutes.
            </p>
            <Link
              href="/login"
              className="text-primary mt-6 inline-block rounded text-sm font-medium"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-ink-secondary mt-1 text-sm">
              Enter your email and we&apos;ll send you a link to choose a new
              password.
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
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Send reset link
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-ink-secondary hover:text-primary rounded text-sm transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
