/**
 * @file Availability Server Actions
 * @description Server-side functions for saving and retrieving business hours.
 *
 * The availability system uses an "upsert" pattern:
 *   - if hours for a day already exist → update them
 *   - if hours for a day don't exist → create them
 *
 * This is wrapped in a Prisma transaction to ensure all 7 days are
 * saved automatically — either all succeed or all fail. No partial saves.
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  availabilitySchema,
  type AvailabilityFormValues,
} from "@/lib/validators/availability";

/** Standard result type for actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Saves the complete weekly schedule for the current user's business.
 *
 * Uses a database transaction to insert all 7 days automatically.
 * "Upsert" = update if exists, create if not.
 *
 * @param values - The complete weekly schedule (7 days)
 * @returns Object with `success` or `error` message
 */
export async function saveAvailability(
  values: AvailabilityFormValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "BUSINESS_OWNER") {
      return { error: "Unauthorized." };
    }

    // Get the user's business
    const business = await db.business.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (!business) {
      return { error: "Business not found. Please create a business first." };
    }

    // Validate the submitted schedule
    const validatedFields = availabilitySchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid schedule data. Please check your input." };
    }

    const { schedule } = validatedFields.data;

    // Use a transaction to save all 7 days automatically.
    // If any single day fails, the entire operation is rolled back.
    await db.$transaction(
      schedule.map((day) =>
        db.businessHours.upsert({
          where: {
            // The compound unique constraint [businessId, dayOfWeek]
            // uniquely identifies each row
            businessId_dayOfWeek: {
              businessId: business.id,
              dayOfWeek: day.dayOfWeek,
            },
          },
          // If the row exists, update it
          update: {
            openTime: day.isClosed ? "00:00" : day.openTime,
            closeTime: day.isClosed ? "00:00" : day.closeTime,
            isClosed: day.isClosed,
          },
          // If the row doesn't exist, create it
          create: {
            businessId: business.id,
            dayOfWeek: day.dayOfWeek,
            openTime: day.isClosed ? "00:00" : day.openTime,
            closeTime: day.isClosed ? "00:00" : day.closeTime,
            isClosed: day.isClosed,
          },
        })
      )
    );

    revalidatePath("/dashboard/availability");

    return { success: "Business hours saved successfully!" };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
