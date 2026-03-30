/**
 * @file Service Form Component
 * @description Form for creating and editing individual services.
 * Designed to be rendered inside a dialog component.
 *
 * Operates in two modes:
 *   - Create: empty form, calls createService action
 *   - Edit: pre-filled form , calls updateService action
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

import {
  serviceSchema,
  type ServiceFormInput,
  type ServiceFormValues,
} from "@/lib/validators/service";
import { createService, updateService } from "@/lib/actions/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/** Props accepted by the ServiceForm component. */
interface ServiceFormProps {
  /** Pre-existing data for edit mode. Omit for create mode. */
  initialData?: ServiceFormValues;
  /** Service ID required for edit mode. */
  serviceId?: string;
  /** Called for a successful create/update so parent can close dialog. */
  onSuccess?: () => void;
}

export function ServiceForm({
  initialData,
  serviceId,
  onSuccess,
}: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!initialData && !!serviceId;

  // const form = useForm<ServiceFormValues>({
  const form = useForm<ServiceFormInput, undefined, ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      price: 0,
      duration: 30,
    },
  });

  /** Handle form submission */
  async function onSubmit(values: ServiceFormValues) {
    setIsLoading(true);

    try {
      const result = isEditMode
        ? await updateService(serviceId, values)
        : await createService(values);

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
        {/* Service name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Classic Haircut"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this service includes..."
                  className="min-h-[80px] resize-y"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional. Help customers understand what to expect.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price and Duration — side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="30.00"
                    disabled={isLoading}
                    value={
                      typeof field.value === "number" ||
                      typeof field.value === "string"
                        ? field.value
                        : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration */}
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="5"
                    min="5"
                    placeholder="30"
                    disabled={isLoading}
                    value={
                      typeof field.value === "number" ||
                      typeof field.value === "string"
                        ? field.value
                        : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
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
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Save Changes"
            ) : (
              "Add Service"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
