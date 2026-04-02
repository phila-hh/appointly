/**
 * @file Business Profile Server Actions
 * @description Server -side functions for creating and updating business profiles.
 *
 * These actions handle:
 *   - Creating a new business profile (first-time setup)
 *   - Updating an existing business profile
 *   - Automatic slug generation with uniqueness handling
 *
 * Both actions validate input with Zod, check authorization,
 * and use revalidatePath to refresh cached page data after mutations.
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/utils";
import {
  businessSchema,
  type BusinessFormValues,
} from "@/lib/validators/business";

/** Standard result type for business actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Create a unique slug for a business name.
 *
 * if "fresh-cuts-barbershop" already exists, appends a numeric suffix:
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

  // Keep checking until we find a slug that doesn't exist
  while (true) {
    const existing = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    // No conflict, or the conflict is the business being updated
    if (!existing || existing.id === excludeId) {
      return slug;
    }

    // Conflict found — try with a suffix
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

    // Check if user already has a business
    const existingBusiness = await db.business.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (existingBusiness) {
      return { error: "You already have a business profile." };
    }

    // Validate input
    const validatedFields = businessSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;

    // Generate a unique slug from the business name
    const slug = await generateUniqueSlug(data.name);

    // Create the business record
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
    });

    // Revalidate dashboard pages so they reflect the new business
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
 * @param values - Updated business profile from data
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

    // Verify ownership
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business || business.ownerId !== user.id) {
      return { error: "Business not found or you do not own it." };
    }

    // Validate input
    const validatedFields = businessSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;

    // Regenerate slug if the name changed
    const slug = await generateUniqueSlug(data.name, businessId);

    // Update the business record
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
    revalidatePath(`/dashboard/${slug}`);

    return { success: "Business profile updated successfully!" };
  } catch (error) {
    console.error("Update business error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
