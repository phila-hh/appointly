/**
 * @file Business Profile Form
 * @description Reusable form for creating and editing business profiles.
 *
 * Operates in two modes:
 *   - Create mod: empty form, calls createBusiness action
 *   - Edit mode: pre-filled mode, calls updateBusiness action
 *
 * The mode is determined by the presence of `initialData` and `businessId` props.
 *
 * @example
 * ```ts
 * // Create mode
 * <BusinessProfileForm />
 *
 * // Edit mode
 * <BusinessProfileForm initialData={business} businessId={business.id} />
 * ```
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  businessSchema,
  type BusinessFormValues,
} from "@/lib/validators/business";
import { createBusiness, updateBusiness } from "@/lib/actions/business";
import { BUSINESS_CATEGORIES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

/** Props accepted by the BusinessProfileForm component. */
interface BusinessProfileFormProps {
  /** Pre-existing data for edit mode. Omit for create mode. */
  initialData?: BusinessFormValues;
  /** Business ID required for edit mode. */
  businessId?: string;
}

export function BusinessProfileForm({
  initialData,
  businessId,
}: BusinessProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /** Determine if we're in edit mode or create mode. */
  const isEditMode = !!initialData && !!businessId;

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      category: undefined,
      phone: "",
      email: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Handle form submission — create or updates based on mode.
  async function onSubmit(values: BusinessFormValues) {
    setIsLoading(true);

    try {
      const result = isEditMode
        ? await updateBusiness(businessId, values)
        : await createBusiness(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        if (!isEditMode) {
          // After creation, redirect to dashboard overview
          router.push("/dashboard/overview");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* ---------------------------------------------------------------- */}
        {/* Basic Information                                                 */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <h3 className="text-lg font-medium">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Tell customers about your business.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Business name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Fresh Cuts Barbershop"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This is how your business will appear to customers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(BUSINESS_CATEGORIES).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1-555-000-0000"
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell customers what makes your business special..."
                    className="min-h-[120px] resize-y"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of your business, services, and what
                  customers can expect. Max 1000 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* ---------------------------------------------------------------- */}
        {/* Contact Information                                               */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <h3 className="text-lg font-medium">Contact Information</h3>
          <p className="text-sm text-muted-foreground">
            How customers can reach you online.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Business email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://yourbusiness.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* ---------------------------------------------------------------- */}
        {/* Location                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <h3 className="text-lg font-medium">Location</h3>
          <p className="text-sm text-muted-foreground">
            Where customers can find you.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Main Street, Suite 100"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Austin" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* State */}
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="TX" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ZIP Code */}
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="73301" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Saving changes..." : "Creating business..."}
              </>
            ) : isEditMode ? (
              "Save Changes"
            ) : (
              "Create Business"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
