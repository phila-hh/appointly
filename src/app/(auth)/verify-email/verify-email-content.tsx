/**
 * @file Verify Email Content Component
 * @description Client component for the verification result page.
 * Reads search params and displays the appropriate message.
 * Includes a resend verification form.
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { resendVerificationEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const isSuccess = status === "success";

  /** Handle resend verification email. */
  async function handleResend() {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerificationEmail(email);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="space-y-6 text-center">
      {/* Status icon */}
      {isSuccess ? (
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
      ) : (
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold tracking-tight">
        {isSuccess ? "Email Verified!" : "Verification Failed"}
      </h1>

      {/* Message */}
      <p className="text-muted-foreground">
        {message ??
          (isSuccess
            ? "Your email has been verified. You can now sign in."
            : "Something went wrong with the verification.")}
      </p>

      {/* Actions */}
      {isSuccess ? (
        <Button asChild className="w-full">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      ) : (
        <div className="space-y-4">
          {/* Resend verification form */}
          <div className="rounded-lg border p-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                Need a new verification link?
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resend-email" className="text-sm">
                Email address
              </Label>
              <Input
                id="resend-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isResending}
              />
            </div>
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>
          </div>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/sign-in">Back to Sign In</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
