/**
 * @file Dashboard Settings Page
 * @description Business profile editing page.
 * Pre-fills the BusinessProfileForm with existing business data.
 *
 * URL: /dashboard/settings
 */

import { requireBusiness } from "@/lib/actions/business-queries";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import type { BusinessFormValues } from "@/lib/validators/business";

export const metadata = {
  title: "Settings",
};

export default async function DashboardSettingsPage() {
  const business = await requireBusiness();

  /**
   * Map the database record to form values.
   * Converts nulls to empty strings because form inputs don't accept null.
   */
  const initialData: BusinessFormValues = {
    name: business.name,
    description: business.description ?? "",
    category: business.category,
    phone: business.phone ?? "",
    email: business.email ?? "",
    website: business.website ?? "",
    address: business.address ?? "",
    city: business.city ?? "",
    state: business.state ?? "",
    zipCode: business.zipCode ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Update your business profile information. Changes will be visible to
          your customers immediately.
        </p>
      </div>

      <BusinessProfileForm initialData={initialData} businessId={business.id} />
    </div>
  );
}
