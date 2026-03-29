/**
 * @file Service Management Server Actions
 * @description Server-side functions for creating, updating, and toggling services.
 *
 * All actions verify that the current user owns the business associated
 * with the service, preventing unauthorized cross-business modifications.
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  serviceSchema,
  type ServiceFormValues,
} from "@/lib/validators/service";

/** Standard result type for server-actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Helper: retrieves the current user's business.
 * Returns null if the user is not authenticated or has no business.
 */
async function getUserBusiness() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_OWNER") return null;

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  return business;
}

/**
 * Create a new service for the current user's business.
 *
 * @param values - Service form data (name, description, price, duration)
 * @returns Object with `success` or `error` message
 */
export async function createService(
  values: ServiceFormValues
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found. Please create a business first." };
    }

    // Validate input
    const validatedFields = serviceSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;

    await db.service.create({
      data: {
        businessId: business.id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        duration: data.duration,
      },
    });

    revalidatePath("/dashboard/services");

    return { success: "Service created successfully!" };
  } catch (error) {
    console.error("Create service error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Update an existing service.
 *
 * Verifies that service belongs to the current user's business
 * before allowing update.
 *
 * @param serviceId - The ID of the service to update
 * @param values - Updated service form data
 * @returns Object with `success` or `error` message
 */
export async function updateService(
  serviceId: string,
  values: ServiceFormValues
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found." };
    }

    // Verify the service belongs to the user's business
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { businessId: true },
    });

    if (!service || service.businessId !== business.id) {
      return { error: "Service not found or you do not own it." };
    }

    // Validate input
    const validatedFields = serviceSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;

    await db.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        duration: data.duration,
      },
    });

    revalidatePath("/dashboard/services");

    return { success: "Service updated successfully!" };
  } catch (error) {
    console.error("Update service error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Toggle a service's active status (soft delete / restore)
 *
 * Active services appear in customer-facing listings and can be booked.
 * Inactive services are hidden but preserved for historical booking records.
 *
 * @param serviceId - The ID of the service to toggle
 * @returns Object with `success` or `error` message
 */
export async function toggleServiceActive(
  serviceId: string
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found." };
    }

    // Verify ownership and get current status
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { businessId: true, isActive: true, name: true },
    });

    if (!service || service.businessId !== business.id) {
      return { error: "Service not found or you do not own it." };
    }

    // Toggle isActive flag
    const newStatus = !service.isActive;

    await db.service.update({
      where: { id: serviceId },
      data: { isActive: newStatus },
    });

    revalidatePath("/dashboard/services");

    const statusLabel = newStatus ? "activated" : "deactivated";
    return { success: `"${service.name}" has been ${statusLabel}.` };
  } catch (error) {
    console.error("Toggle service error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
