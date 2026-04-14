"use client";

import { Button } from "@/components/ui/button";

interface ConfirmActionFormProps {
  action: () => unknown | Promise<unknown>;
  confirmMessage: string;
  label: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function ConfirmActionForm({
  action,
  confirmMessage,
  label,
  variant = "outline",
}: ConfirmActionFormProps) {
  return (
    <form
      action={async () => {
        await action();
      }}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}
