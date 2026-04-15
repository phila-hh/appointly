/**
 * @file Staff Booking Filter Component
 * @description Client-side filter for the dashboard bookings page
 * that allows business owners to filter bookings by staff member.
 *
 * Updates the URL search params on change so the filter state is
 * preserved on refresh and shareable as a link. Combines with the
 * existing status filter query param.
 *
 * Only rendered when the business has at least one staff member.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shape of a staff member option for the filter. */
interface StaffFilterOption {
  id: string;
  name: string;
  title: string | null;
}

/** Props accepted by the StaffBookingFilter component. */
interface StaffBookingFilterProps {
  /** All staff members for the business. */
  staffMembers: StaffFilterOption[];
  /** Currently active staff filter value from URL. */
  currentStaffId?: string;
}

/** Sentinel value for "All Staff" (no filter). */
const ALL_STAFF_VALUE = "ALL";

export function StaffBookingFilter({
  staffMembers,
  currentStaffId,
}: StaffBookingFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Update the staffId query parameter while preserving other params
   * (e.g., the existing status filter).
   */
  function handleStaffChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === ALL_STAFF_VALUE) {
      params.delete("staffId");
    } else {
      params.set("staffId", value);
    }

    router.push(`/dashboard/bookings?${params.toString()}`);
  }

  const currentValue = currentStaffId ?? ALL_STAFF_VALUE;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Filter by staff:</span>
      </div>
      <Select value={currentValue} onValueChange={handleStaffChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STAFF_VALUE}>All Staff</SelectItem>
          {staffMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <span className="flex items-center gap-2">
                {member.name}
                {member.title && (
                  <span className="text-xs text-muted-foreground">
                    — {member.title}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
