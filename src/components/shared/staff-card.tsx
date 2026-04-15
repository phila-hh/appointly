/**
 * @file Staff Card Component
 * @description Displays a single staff member with their details and
 * management actions.
 *
 * Shows:
 *   - Staff name with title subtitle
 *   - Active/inactive badge
 *   - Contact info (email, phone)
 *   - Assigned services as small badges
 *   - Booking count
 *   - Action buttons: edit details, manage services, set hours
 *   - Active/inactive toggle switch
 *
 * Used on the dashboard staff page for team management.
 */

"use client";

import { useState } from "react";
import {
  Pencil,
  Scissors,
  Clock,
  Mail,
  Phone,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { toggleStaffActive, deleteStaff } from "@/lib/actions/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { StaffData } from "@/app/dashboard/staff/staff-list";

/** Props accepted by the StaffCard component. */
interface StaffCardProps {
  /** The staff member data to display. */
  staff: StaffData;
  /** Called when the edit button is clicked. */
  onEdit: (staff: StaffData) => void;
  /** Called when the "Manage Services" button is clicked. */
  onManageServices: (staff: StaffData) => void;
  /** Called when the "Set Hours" button is clicked. */
  onSetHours: (staff: StaffData) => void;
}

export function StaffCard({
  staff,
  onEdit,
  onManageServices,
  onSetHours,
}: StaffCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /** Handle active/inactive toggle. */
  async function handleToggle() {
    setIsToggling(true);

    try {
      const result = await toggleStaffActive(staff.id);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      toast.error("Failed to update staff status.");
    } finally {
      setIsToggling(false);
    }
  }

  /** Handle staff deletion with confirmation. */
  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteStaff(staff.id);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      toast.error("Failed to delete staff member.");
    } finally {
      setIsDeleting(false);
    }
  }

  /** Whether the staff member has hours configured. */
  const hasHours = staff.hours.length > 0;

  /** Count of working days (non-closed days). */
  const workingDays = staff.hours.filter((h) => !h.isClosed).length;

  return (
    <Card className={!staff.isActive ? "opacity-60" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{staff.name}</CardTitle>
            <Badge variant={staff.isActive ? "default" : "secondary"}>
              {staff.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {staff.title && (
            <p className="text-sm text-muted-foreground">{staff.title}</p>
          )}
        </div>

        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onEdit(staff)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {staff.name}</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact info */}
        {(staff.email || staff.phone) && (
          <div className="space-y-1.5 text-sm">
            {staff.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{staff.email}</span>
              </div>
            )}
            {staff.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{staff.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Assigned services */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Services ({staff.assignedServices.length})
            </span>
          </div>
          {staff.assignedServices.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {staff.assignedServices.map((service) => (
                <Badge key={service.id} variant="outline" className="text-xs">
                  {service.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              No services assigned
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {staff.bookingCount} booking{staff.bookingCount === 1 ? "" : "s"}
          </span>
          {hasHours && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {workingDays} day{workingDays === 1 ? "" : "s"}/week
            </span>
          )}
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageServices(staff)}
          >
            <Scissors className="mr-1.5 h-3.5 w-3.5" />
            Services
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSetHours(staff)}>
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Hours
          </Button>

          {/* Delete button — only shown when no bookings */}
          {staff.bookingCount === 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete &quot;{staff.name}&quot;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this staff member, their
                    service assignments, and their schedule. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Separator />

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {staff.isActive
              ? "Active — visible to customers"
              : "Inactive — hidden from booking"}
          </span>
          <Switch
            checked={staff.isActive}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            aria-label={`Toggle ${staff.name} active status`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
