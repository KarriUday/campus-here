import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign Up — Campus Here",
  description: "Create your Campus Here student account using your college email and USN.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
