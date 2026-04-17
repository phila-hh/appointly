/**
 * @file Email Verification Result Page
 * @description Shows the result of an email verification attempt.
 *
 * Displays either a success or error message based on the URL
 * search params set by the verification API route.
 *
 * Also provides a form to resend the verification email if the
 * link expired or was lost.
 *
 * URL: /verify-email?status=success|error&message=...
 */

import { Suspense } from "react";
import { VerifyEmailContent } from "./verify-email-content";

export const metadata = {
  title: "Verify Email",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-16 w-16 mx-auto animate-pulse rounded-full bg-muted" />
      <div className="h-8 w-48 mx-auto animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 mx-auto animate-pulse rounded bg-muted" />
    </div>
  );
}
