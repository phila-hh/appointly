/**
 * @file Password Input Component
 * @description A text input with a visibility toggle button (eye icon).
 * Allows users to show/hide their password while typing.
 *
 * Built on top of the base ahadcn input component, extending it with
 * toggle functionality. Supports all standard input props (placeholder,
 * disabled, className, etc.) via React.forwardRef.
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   placeholder="Enter your password"
 *   {...field}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * PasswordInput component props.
 * Extends all standard HTML input attributes except `type`
 * (which is managed internally to toggle between "password" and "text").
 */
type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

/**
 * PasswordInput with visibility toggle.
 *
 * Uses `React.forwardRef` so react-hook-form can attach a ref to this
 * component for focus management and form registration.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    // Track whether the password is currently visible
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        {/* The actual input — type toggles between "password" and "text" */}
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)} // Right padding for the toggle button
          ref={ref}
          {...props}
        />

        {/* Toggle button — positioned inside the input on the right */}
        <Button
          type="button" // Prevent form submission when clicking
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
