/**
 * @file Profile Page
 * @description Customer profile management page.
 *
 * Sections:
 *   - Personal information (name, email, phone)
 *   - Change password (credential users only)
 *   - Email notification preferences
 *
 * URL: /profile
 */

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getEmailPreferences } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/forms/profile-form";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { EmailPreferences } from "@/components/shared/email-preferences";
import db from "@/lib/db";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch full user data for the profile form
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      password: true, // Check if credential user (has password)
    },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  // Fetch email preferences separately
  const emailPreferences = await getEmailPreferences();

  /** Whether the user signed up with credentials (has a password). */
  const isCredentialUser = !!dbUser.password;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Profile Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account information and notification preferences.
          </p>
        </div>

        {/* Personal information */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <ProfileForm
            initialData={{
              name: dbUser.name ?? "",
              email: dbUser.email,
              phone: dbUser.phone ?? "",
            }}
          />
        </section>

        {/* Change password — only for credential users */}
        {isCredentialUser && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Change Password</h2>
            <ChangePasswordForm />
          </section>
        )}

        {/* Email preferences */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Email Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Choose which emails you&apos;d like to receive from Appointly.
            </p>
          </div>
          <EmailPreferences initialPreferences={emailPreferences} />
        </section>
      </div>
    </div>
  );
}
