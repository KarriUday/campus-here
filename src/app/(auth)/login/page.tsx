import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The form reads `?next=` via useSearchParams, which opts it out of
 * prerendering. Keeping it behind Suspense lets the card shell stay static.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardBody className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardBody>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
