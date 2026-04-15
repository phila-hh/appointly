/**
 * @file Dashboard Staff Page
 * @description Staff member management for business owners.
 *
 * Features:
 *   - Display all staff members (active and inactive) as cards
 *   - "Add Staff" button opens a dialog with the staff form
 *   - Edit staff details, assign services, and set hours
 *   - Toggle switch to activate/deactivate staff members
 *   - Empty state when no staff members exist yet
 *
 * Architecture:
 *   - This page is a server component that fetches staff and services
 *   - It renders the StaffList client component, passing data as props
 *   - StaffList manages dialog state and renders cards
 *
 * URL: /dashboard/staff
 */

import {
  requireBusiness,
  getBusinessServices,
} from "@/lib/actions/business-queries";
import { getBusinessStaff } from "@/lib/actions/staff-queries";
import { StaffList } from "./staff-list";

export const metadata = {
  title: "Staff",
};

export default async function DashboardStaffPage() {
  // Ensure business exists (redirects to setup if not)
  await requireBusiness();

  // Fetch all staff for this business
  const staff = await getBusinessStaff();

  // Fetch all services (needed for service assignment UI)
  const services = await getBusinessServices();

  /**
   * Serialize the staff data for the client component.
   * Flatten nested relations into a simpler shape that is
   * directly serializable as React props.
   */
  const serializedStaff = staff.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    title: member.title,
    image: member.image,
    isActive: member.isActive,
    bookingCount: member._count.bookings,
    assignedServices: member.services.map((ss) => ({
      id: ss.service.id,
      name: ss.service.name,
    })),
    hours: member.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    })),
  }));

  /**
   * Serialize services for the service assignment form.
   * Only active services can be assigned to staff.
   */
  const serializedServices = services
    .filter((s) => s.isActive)
    .map((service) => ({
      id: service.id,
      name: service.name,
    }));

  return (
    <div className="space-y-6">
      <StaffList staff={serializedStaff} services={serializedServices} />
    </div>
  );
}
