import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The form reads `?next=` via useSearchParams, which opts it out of
 * prerendering. Keeping it behind Suspense lets the page shell stay static.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5" aria-label="Loading sign-in form">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-full" />
          <div className="space-y-4 pt-5">
            <Skeleton className="h-13 w-full" />
            <Skeleton className="h-13 w-full" />
            <Skeleton className="h-13 w-full" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
