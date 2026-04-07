/**
 * @file Profile Page
 * @description Customer profile management page.
 *
 * Features:
 *   - View and edit profile information (name, email, phone)
 *   - Change password
 *   - View avatar with initials
 *
 * Future enhancements:
 *   - Avatar image upload
 *   - Account deletion
 *   - Email verification status
 *
 * URL: /profile
 */

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProfileForm } from "@/components/forms/profile-form";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export const metadata = {
  title: "Profile Settings",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Prepare initial data for the profile form
  const profileData = {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: "", // Phone is not in the session, we'll fetch it separately
  };

  // Fetch the full user record to get the phone number
  // (Session doesn't include phone to keep JWT payload small)
  const db = (await import("@/lib/db")).default;
  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { phone: true },
  });

  if (fullUser?.phone) {
    profileData.phone = fullUser.phone;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Profile Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account information and preferences.
          </p>
        </div>

        {/* Avatar section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <UserAvatar
                name={user.name}
                image={user.image}
                className="h-20 w-20 text-2xl"
              />
              <div className="text-sm text-muted-foreground">
                <p>Avatar images are currently generated from your initials.</p>
                <p className="mt-1">Image upload coming soon.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm initialData={profileData} />
          </CardContent>
        </Card>

        <Separator />

        {/* Password change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
