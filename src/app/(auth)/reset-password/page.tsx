import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardBody className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardBody>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
