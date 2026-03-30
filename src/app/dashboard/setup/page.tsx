/**
 * @file Business Setup Page
 * @description Onboarding page for new business owners to create their
 * business profile for the first time.
 *
 * This page is show when a BUSINESS_OWNER user navigates the dashboard
 * but does not yet have a business record in the database. The dashboard
 * layout redirects them here automatically.
 *
 * After successful business creation, the user is redirected to
 * /dashboard/overview
 *
 * URL: /dashboard/setup
 */

import { redirect } from "next/navigation";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";

export const metadata = {
  title: "Set Up Your Business",
};

export default async function BusinessSetupPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "BUSINESS_OWNER") {
    redirect("/sign-in");
  }

  // If user already has a business, redirect to overview
  const existingBusiness = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (existingBusiness) {
    redirect("/dashboard/overview");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Set Up Your Business
        </h2>
        <p className="text-muted-foreground">
          Welcome! Let&apos;s create your business profile. Customers will see
          this information when browsing your services.
        </p>
      </div>

      <BusinessProfileForm />
    </div>
  );
}
