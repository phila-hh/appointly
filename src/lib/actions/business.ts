/**
 * @file Business Profile Server Actions
 * @description Server-side functions for creating and updating business
 * profiles, and managing public announcements.
 *
 * These actions handle:
 *   - Creating a new business profile (first-time setup)
 *   - Updating an existing business profile
 *   - Automatic slug generation with uniqueness handling
 *   - Setting or clearing a public business announcement
 *
 * Both profile actions validate input with Zod, check authorization,
 * and use revalidatePath to refresh cached page data after mutations.
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/utils";
import {
  businessSchema,
  announcementSchema,
  type BusinessFormValues,
  type AnnouncementFormValues,
} from "@/lib/validators/business";

/** Standard result type for business actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Create a unique slug for a business name.
 *
 * If "fresh-cuts-barbershop" already exists, appends a numeric suffix:
 * "fresh-cuts-barbershop-2", "fresh-cuts-barbershop-3", etc.
 *
 * @param name - The business name to slugify
 * @param excludeId - Optional business ID to exclude from collision check
 *                    (used during updates so the business's own slug isn't a conflict)
 * @returns A unique slug string
 */
async function generateUniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Create a new business profile for the current user.
 *
 * Pre-conditions:
 *   - User must be authenticated with BUSINESS_OWNER role
 *   - User must not already have a business
 *
 * @param values - Business profile form data
 * @returns Object with `success` or `error` message
 */
export async function createBusiness(
  values: BusinessFormValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "BUSINESS_OWNER") {
      return { error: "Unauthorized. You must be a business owner." };
    }

    const existingBusiness = await db.business.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (existingBusiness) {
      return { error: "You already have a business profile." };
    }

    const validatedFields = businessSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;
    const slug = await generateUniqueSlug(data.name);

    await db.business.create({
      data: {
        ownerId: user.id,
        name: data.name,
        slug,
        description: data.description || null,
        category: data.category,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
      },
      select: { ownerId: true },
    });

    // Notify all admins that a new business has been registered
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "NEW_BUSINESS",
          title: "New Business Registered",
          message: `${data.name} has created a business profile on the platform.`,
          link: `/admin/businesses`,
        })
      )
    ).catch((err) => console.error("New business notification error:", err));

    revalidatePath("/dashboard", "layout");

    return { success: "Business profile created successfully!" };
  } catch (error) {
    console.error("Create business error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Update an existing business profile.
 *
 * Pre-conditions:
 *   - User must be authenticated with BUSINESS_OWNER role
 *   - User must own the business being updated
 *
 * @param businessId - The ID of the business to be updated
 * @param values - Updated business profile form data
 * @returns Object with `success` or `error` message
 */
export async function updateBusiness(
  businessId: string,
  values: BusinessFormValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "BUSINESS_OWNER") {
      return { error: "Unauthorized. You must be a business owner." };
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business || business.ownerId !== user.id) {
      return { error: "Business not found or you do not own it." };
    }

    const validatedFields = businessSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;
    const slug = await generateUniqueSlug(data.name, businessId);

    await db.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
      },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath(`/business/${slug}`);

    return { success: "Business profile updated successfully!" };
  } catch (error) {
    console.error("Update business error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Sets or clears a public announcement for the current user's business.
 *
 * The announcement is displayed as a banner on the public business page.
 * Passing an empty string for `announcement` clears both the text and
 * the expiry date, effectively removing the banner.
 *
 * Expiry behaviour:
 *   - announcementExpiresAt = null  → permanent until manually removed
 *   - announcementExpiresAt = date  → auto-hidden after that date on the
 *                                     public page (checked at render time)
 *
 * @param values - Announcement text and optional expiry date
 * @returns Object with `success` or `error` message
 */
export async function updateAnnouncement(
  values: AnnouncementFormValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "BUSINESS_OWNER") {
      return { error: "Unauthorized. You must be a business owner." };
    }

    const business = await db.business.findUnique({
      where: { ownerId: user.id },
      select: { id: true, slug: true },
    });

    if (!business) {
      return { error: "Business not found. Please create a business first." };
    }

    const validatedFields = announcementSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid announcement data. Please check your input." };
    }

    const { announcement, announcementExpiresAt } = validatedFields.data;

    const isClearing = !announcement || announcement.trim() === "";

    await db.business.update({
      where: { id: business.id },
      data: {
        announcement: isClearing ? null : announcement.trim(),
        // If clearing the announcement, reset expiry too.
        // If setting, parse the date string or keep null for permanent.
        announcementExpiresAt: isClearing
          ? null
          : announcementExpiresAt && announcementExpiresAt !== ""
            ? new Date(announcementExpiresAt)
            : null,
      },
    });

    revalidatePath(`/business/${business.slug}`);
    revalidatePath("/dashboard/settings");

    const successMessage = isClearing
      ? "Announcement removed."
      : "Announcement updated successfully!";

    return { success: successMessage };
  } catch (error) {
    console.error("updateAnnouncement error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// Imported here to avoid circular dependency — notification.ts imports db,
// business.ts imports notification for the NEW_BUSINESS trigger.
import { createNotification } from "@/lib/actions/notification";
