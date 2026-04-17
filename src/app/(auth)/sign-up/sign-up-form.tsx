/**
 * @file Sign Up Form Component
 * @description Client component containing the registration form logic.
 *
 * Features:
 *   - "Continue with Google" OAuth button (creates CUSTOMER account)
 *   - Full registration form with role selection
 *   - Password strength requirements
 *   - Client-side + server-side validation
 *   - Email verification notice on success
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { signIn as nextAuthSignIn } from "next-auth/react";

import { signUpSchema, type SignUpFormValues } from "@/lib/validators/auth";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Google "G" logo as inline SVG. */
function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  /** Handle credential form submission */
  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);

    try {
      const result = await signUp(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        router.push("/sign-in?registered=true");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  /** Handle Google sign-up (creates CUSTOMER account) */
  async function handleGoogleSignUp() {
    setIsGoogleLoading(true);

    try {
      await nextAuthSignIn("google", {
        callbackUrl: "/browse",
      });
    } catch {
      toast.error("Failed to sign up with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  }

  const isAnyLoading = isLoading || isGoogleLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to get started with Appointly.
        </p>
      </div>

      {/* Google sign-up button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignUp}
        disabled={isAnyLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Google sign-up creates a customer account. Choose &quot;Manage a
        business&quot; below for a business owner account.
      </p>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or create with email
          </span>
        </div>
      </div>

      {/* Credential form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    disabled={isAnyLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    disabled={isAnyLoading}
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
                    placeholder="At least 8 characters"
                    disabled={isAnyLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm password field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Re-enter your password"
                    disabled={isAnyLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role selection */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>I want to...</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isAnyLoading}
                    className="grid grid-cols-2 gap-3"
                  >
                    {/* Customer option */}
                    <Label
                      htmlFor="role-customer"
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4",
                        "cursor-pointer transition-colors hover:bg-accent",
                        "[&:has([data-state=checked])]:border-primary",
                        "[&:has([data-state=checked])]:bg-primary/5"
                      )}
                    >
                      <RadioGroupItem
                        value="CUSTOMER"
                        id="role-customer"
                        className="sr-only"
                      />
                      <User className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Book services</span>
                      <span className="text-xs text-center text-muted-foreground">
                        Find and book appointments
                      </span>
                    </Label>

                    {/* Business owner option */}
                    <Label
                      htmlFor="role-business"
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4",
                        "cursor-pointer transition-colors hover:bg-accent",
                        "[&:has([data-state=checked])]:border-primary",
                        "[&:has([data-state=checked])]:bg-primary/5"
                      )}
                    >
                      <RadioGroupItem
                        value="BUSINESS_OWNER"
                        id="role-business"
                        className="sr-only"
                      />
                      <Briefcase className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Manage a business
                      </span>
                      <span className="text-xs text-center text-muted-foreground">
                        List services and take bookings
                      </span>
                    </Label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isAnyLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>

      {/* Sign-in link */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
