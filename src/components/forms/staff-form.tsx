/**
 * @file Staff Form Component
 * @description Form for creating and editing staff member details.
 * Designed to be rendered inside a dialog component.
 *
 * Operates in two modes:
 *   - Create: empty form, calls createStaff action
 *   - Edit: pre-filled form, calls updateStaff action
 *
 * Calls `onSuccess` prop after a successful operation so the parent
 * component can close the dialog.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { staffSchema, type StaffFormValues } from "@/lib/validators/staff";
import { createStaff, updateStaff } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/** Props accepted by the StaffForm component. */
interface StaffFormProps {
  /** Pre-existing data for edit mode. Omit for create mode. */
  initialData?: StaffFormValues;
  /** Staff member ID required for edit mode. */
  staffId?: string;
  /** Called after a successful create/update so parent can close dialog. */
  onSuccess?: () => void;
}

export function StaffForm({ initialData, staffId, onSuccess }: StaffFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!initialData && !!staffId;

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: initialData ?? {
      name: "",
      email: "",
      phone: "",
      title: "",
    },
  });

  /** Handle form submission. */
  async function onSubmit(values: StaffFormValues) {
    setIsLoading(true);

    try {
      const result = isEditMode
        ? await updateStaff(staffId, values)
        : await createStaff(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        form.reset();
        onSuccess?.();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Staff name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Abebe Kebede"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title / Role */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title / Role</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Senior Barber, Lead Stylist"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional. Displayed to customers when booking.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email and Phone — side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+251-9XX-XXXXXX"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Saving..." : "Adding..."}
              </>
            ) : isEditMode ? (
              "Save Changes"
            ) : (
              "Add Staff Member"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
