/**
 * @file Sign Up Page
 * @description User registration page with role selection (Customer or Business Owner).
 *
 * This is a Client Component because it uses:
 *   - react-hook-form for form state management
 *   - useState for loading/error state
 *   - Event handlers for form submission
 *
 * The form validates using Zod on the client (instant feedback) and
 * re-validates on the server in the signUp action (security).
 *
 * URL: /sign-up
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Briefcase } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  // Loading state 9 disables the form while submitting
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Initialize react-hook-form with Zod validation.
   *
   * - `resolver: zodResolver(signUpSchema)` connects Zod to the form.
   *   When the user submits, react-hook-form runs the Zod schema against
   *   the form values and shows errors on the relevant fields.
   *
   * - `defaultValues` sets the initial state of each field.
   *   Always provide defaults — otherwise fields are `undefined` and
   *   React warns about = component switches.
   */
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined, // No role selected initially
    },
  });

  /**
   * Form submission handler.
   * Called only when all Zod validations pass on the client side.
   *
   * @param values - The validated form data
   */
  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);

    try {
      // Call the server action (runs on the server, returns a result)
      const result = await signUp(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        // Redirect to sign-in with a query param for the success message
        router.push("/sign-in?registered=true");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      // Always reset loading state, whether success or failure.
      // `finally` runs after both `try` and `catch`.
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to get started with Appointly.
        </p>
      </div>

      {/* Form */}
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
                    disabled={isLoading}
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
                    placeholder="At least 8 characters"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
          <Button type="submit" className="w-full" disabled={isLoading}>
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

      {/* Separator and sign-in link */}
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
