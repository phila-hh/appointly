/**
 * @file Sign In Page
 * @description User login page with email and password.
 *
 * Features:
 *   - Shows a success toast when redirected from sign-up (?registered=true)
 *   - Validate input with Zod before submitting
 *   - Loading state during authentication
 *   - Error display via toast notification
 *   - Link to sign-up page
 *
 * URL: /sign-in
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { signInSchema, type SignInFormValues } from "@/lib/validators/auth";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  /**
   * Show a toast message if the user just registered.
   * The sign-up page redirects to /sign-in?registered=true on success.
   *
   * useEffect runs AFTER the component renders so the toast appears
   * once the page is visible. The empty dependency array with
   * searchParams means it only re-runs if the URL params change.
   */
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success("Account created successfully. Please sign in.");
    }
  }, [searchParams]);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Form submission handler.
   * Calls the login server action, which either:
   *   - Redirects on success (we never see a return value)
   *   - Returns an error object on failure
   */
  async function onSubmit(values: SignInFormValues) {
    setIsLoading(true);

    try {
      const result = await login(values);

      // If we get a result it means login failed (success causes a redirect)
      if (result?.error) {
        toast.error(result.error);
      }
    } catch {
      // The redirect from signin throws an error internally.
      // If we reach here with a genuine error, show a message.
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to sign in to your account.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Enter your password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      {/* Sign-up link */}
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
