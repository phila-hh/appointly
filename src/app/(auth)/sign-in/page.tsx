/**
 * @file Sign In Page
 * @description User login page with email and password
 *
 * This file wraps the sign-in form in a Suspense boundary because
 * useSearchParams() requires it in Next.js App Router for static rendering.
 *
 * URL: /sign-in
 */

import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

/** Metadata for the page (used by Next.js for <title> and SEO) */
export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFormSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}

/**
 * Loading skeleton for the sign-in form.
 * Shows placeholder blocks while the form loads.
 * This prevents layout shift and gives users visual feedback.
 */
function SignInFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
