/**
 * @file Unsubscribe Content Component
 * @description Client component that reads URL params and renders the
 * appropriate unsubscribe result message.
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const message = searchParams.get("message");

  const isSuccess = status === "success";

  return (
    <Card className="w-full">
      <CardContent className="p-8 text-center space-y-6">
        {/* Status icon */}
        {isSuccess ? (
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        ) : (
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight">
          {isSuccess ? "Unsubscribed" : "Unsubscribe Failed"}
        </h1>

        {/* Message */}
        <p className="text-muted-foreground">
          {isSuccess
            ? `You've been unsubscribed from ${type ?? "these emails"}. You won't receive them anymore.`
            : (message ?? "Something went wrong. Please try again.")}
        </p>

        {/* Info note */}
        {isSuccess && (
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-left">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You&apos;ll still receive important transactional emails such as
              booking confirmations and payment receipts. To manage all email
              preferences, visit your profile settings.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/profile">Manage Email Preferences</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/browse">Browse Services</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
