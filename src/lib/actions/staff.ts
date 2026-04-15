/**
 * @file Staff Management Server Actions
 * @description Server-side functions for managing staff members, their
 * service assignments, and individual working hours.
 *
 * All actions verify that the current user owns the business associated
 * with the staff member, preventing unauthorized cross-business modifications.
 *
 * Actions are grouped into three categories:
 *   1. Staff CRUD — create, update, toggle active, delete
 *   2. Service assignment — update which services a staff member can perform
 *   3. Hours management — save individual weekly schedule
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  staffSchema,
  staffServiceSchema,
  staffHoursSchema,
  type StaffFormValues,
  type StaffServiceFormValues,
  type StaffHoursFormValues,
} from "@/lib/validators/staff";

/** Standard result type for server actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

// =============================================================================
// Helpers
// =============================================================================

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
 * Helper: verifies a staff member belongs to the current user's business.
 * Returns the staff record if valid, null otherwise.
 */
async function verifyStaffOwnership(staffId: string, businessId: string) {
  const staff = await db.staff.findUnique({
    where: { id: staffId },
    select: { id: true, businessId: true, name: true, isActive: true },
  });

  if (!staff || staff.businessId !== businessId) return null;

  return staff;
}

// =============================================================================
// Staff CRUD Actions
// =============================================================================

/**
 * Create a new staff member for the current user's business.
 *
 * @param values - Staff form data (name, email, phone, title)
 * @returns Object with `success` or `error` message
 */
export async function createStaff(
  values: StaffFormValues
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found. Please create a business first." };
    }

    // Validate input
    const validatedFields = staffSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;

    await db.staff.create({
      data: {
        businessId: business.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
      },
    });

    revalidatePath("/dashboard/staff");

    return { success: "Staff member added successfully!" };
  } catch (error) {
    console.error("Create staff error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Update an existing staff member's details.
 *
 * Verifies that the staff member belongs to the current user's business
 * before allowing the update.
 *
 * @param staffId - The ID of the staff member to update
 * @param values - Updated staff form data
 * @returns Object with `success` or `error` message
 */
export async function updateStaff(
  staffId: string,
  values: StaffFormValues
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found." };
    }

    // Verify the staff member belongs to the user's business
    const staff = await verifyStaffOwnership(staffId, business.id);
    if (!staff) {
      return {
        error: "Staff member not found or you do not own this business.",
      };
    }

    // Validate input
    const validatedFields = staffSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const data = validatedFields.data;

    await db.staff.update({
      where: { id: staffId },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
      },
    });

    revalidatePath("/dashboard/staff");

    return { success: "Staff member updated successfully!" };
  } catch (error) {
    console.error("Update staff error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Toggle a staff member's active status (soft deactivate / reactivate).
 *
 * Active staff appear in customer-facing booking flow and can be assigned
 * to bookings. Inactive staff are hidden but preserved for historical records.
 *
 * @param staffId - The ID of the staff member to toggle
 * @returns Object with `success` or `error` message
 */
export async function toggleStaffActive(
  staffId: string
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found." };
    }

    // Verify ownership and get current status
    const staff = await verifyStaffOwnership(staffId, business.id);
    if (!staff) {
      return {
        error: "Staff member not found or you do not own this business.",
      };
    }

    // Toggle isActive flag
    const newStatus = !staff.isActive;

    await db.staff.update({
      where: { id: staffId },
      data: { isActive: newStatus },
    });

    revalidatePath("/dashboard/staff");

    const statusLabel = newStatus ? "activated" : "deactivated";
    return { success: `"${staff.name}" has been ${statusLabel}.` };
  } catch (error) {
    console.error("Toggle staff active error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Delete a staff member permanently.
 *
 * Only allowed if the staff member has no associated bookings.
 * If bookings exist, the business owner should deactivate instead.
 *
 * @param staffId - The ID of the staff member to delete
 * @returns Object with `success` or `error` message
 */
export async function deleteStaff(staffId: string): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found." };
    }

    // Verify ownership
    const staff = await verifyStaffOwnership(staffId, business.id);
    if (!staff) {
      return {
        error: "Staff member not found or you do not own this business.",
      };
    }

    // Check for existing bookings
    const bookingCount = await db.booking.count({
      where: { staffId },
    });

    if (bookingCount > 0) {
      return {
        error: `"${staff.name}" has ${bookingCount} booking${bookingCount === 1 ? "" : "s"} and cannot be deleted. Deactivate instead to hide them from new bookings.`,
      };
    }

    // Safe to delete — cascade will remove StaffService and StaffHours
    await db.staff.delete({
      where: { id: staffId },
    });

    revalidatePath("/dashboard/staff");

    return { success: `"${staff.name}" has been removed.` };
  } catch (error) {
    console.error("Delete staff error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// =============================================================================
// Staff Service Assignment Actions
// =============================================================================

/**
 * Update the services a staff member can perform.
 *
 * Uses a delete-then-create pattern inside a transaction to replace
 * all existing assignments atomically. This is simpler and safer than
 * trying to diff individual assignments.
 *
 * @param values - Staff ID and array of service IDs to assign
 * @returns Object with `success` or `error` message
 */
export async function updateStaffServices(
  values: StaffServiceFormValues
): Promise<ActionResult> {
  try {
    const business = await getUserBusiness();
    if (!business) {
      return { error: "Business not found." };
    }

    // Validate input
    const validatedFields = staffServiceSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid input. Please select at least one service." };
    }

    const { staffId, serviceIds } = validatedFields.data;

    // Verify staff ownership
    const staff = await verifyStaffOwnership(staffId, business.id);
    if (!staff) {
      return {
        error: "Staff member not found or you do not own this business.",
      };
    }

    // Verify all services belong to the same business
    const services = await db.service.findMany({
      where: {
        id: { in: serviceIds },
        businessId: business.id,
      },
      select: { id: true },
    });

    if (services.length !== serviceIds.length) {
      return { error: "One or more selected services are invalid." };
    }

    // Transaction: delete existing assignments, create new ones
    await db.$transaction([
      // Remove all existing service assignments for this staff
      db.staffService.deleteMany({
        where: { staffId },
      }),

      // Create new assignments
      ...serviceIds.map((serviceId) =>
        db.staffService.create({
          data: { staffId, serviceId },
        })
      ),
    ]);

    revalidatePath("/dashboard/staff");

    return {
      success: `Services updated for "${staff.name}". ${serviceIds.length} service${serviceIds.length === 1 ? "" : "s"} assigned.`,
    };
  } catch (error) {
    console.error("Update staff services error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// =============================================================================
// Staff Hours Actions
// =============================================================================

/**
 * Saves the complete weekly schedule for a staff member.
 *
 * Uses the same upsert-in-transaction pattern as `saveAvailability`
 * for business hours. All 7 days are saved atomically.
 *
 * Validates that staff hours do not exceed business hours — a staff
 * member cannot be scheduled to work when the business is closed,
 * or outside the business's operating window.
 *
 * @param values - Staff ID and the complete weekly schedule (7 days)
 * @returns Object with `success` or `error` message
 */
export async function saveStaffHours(
  values: StaffHoursFormValues
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

    // Validate input
    const validatedFields = staffHoursSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid schedule data. Please check your input." };
    }

    const { staffId, schedule } = validatedFields.data;

    // Verify staff ownership
    const staff = await verifyStaffOwnership(staffId, business.id);
    if (!staff) {
      return {
        error: "Staff member not found or you do not own this business.",
      };
    }

    // Fetch business hours for cross-validation
    const businessHours = await db.businessHours.findMany({
      where: { businessId: business.id },
    });

    // Validate staff hours against business hours
    for (const day of schedule) {
      if (day.isClosed) continue; // Staff is off this day — no conflict

      const bizDay = businessHours.find((h) => h.dayOfWeek === day.dayOfWeek);

      // Business is closed this day but staff is marked as working
      if (!bizDay || bizDay.isClosed) {
        const dayLabel =
          day.dayOfWeek.charAt(0) + day.dayOfWeek.slice(1).toLowerCase();
        return {
          error: `Staff cannot work on ${dayLabel} — the business is closed that day.`,
        };
      }

      // Staff hours must be within business hours
      if (day.openTime < bizDay.openTime || day.closeTime > bizDay.closeTime) {
        const dayLabel =
          day.dayOfWeek.charAt(0) + day.dayOfWeek.slice(1).toLowerCase();
        return {
          error: `Staff hours on ${dayLabel} (${day.openTime}–${day.closeTime}) exceed business hours (${bizDay.openTime}–${bizDay.closeTime}).`,
        };
      }
    }

    // Use a transaction to save all 7 days atomically
    await db.$transaction(
      schedule.map((day) =>
        db.staffHours.upsert({
          where: {
            staffId_dayOfWeek: {
              staffId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            openTime: day.isClosed ? "00:00" : day.openTime,
            closeTime: day.isClosed ? "00:00" : day.closeTime,
            isClosed: day.isClosed,
          },
          create: {
            staffId,
            dayOfWeek: day.dayOfWeek,
            openTime: day.isClosed ? "00:00" : day.openTime,
            closeTime: day.isClosed ? "00:00" : day.closeTime,
            isClosed: day.isClosed,
          },
        })
      )
    );

    revalidatePath("/dashboard/staff");

    return { success: `Schedule saved for "${staff.name}"!` };
  } catch (error) {
    console.error("Save staff hours error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
