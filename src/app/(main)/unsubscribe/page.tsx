/**
 * @file Unsubscribe Result Page
 * @description Shown after a user clicks an unsubscribe link in an email.
 * Displays success or error message and offers a link to manage all
 * email preferences.
 *
 * URL: /unsubscribe?status=success|error&type=...&message=...
 */

import { Suspense } from "react";
import { UnsubscribeContent } from "./unsubscribe-content";

export const metadata = {
  title: "Email Preferences",
};

export default function UnsubscribePage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
      <Suspense fallback={<UnsubscribeSkeleton />}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}

function UnsubscribeSkeleton() {
  return (
    <div className="w-full space-y-6 text-center">
      <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-muted" />
      <div className="mx-auto h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mx-auto h-4 w-72 animate-pulse rounded bg-muted" />
    </div>
  );
}
