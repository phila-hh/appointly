/**
 * @file Staff List Component
 * @description Client component managing the staff list display and
 * the add/edit staff dialogs.
 *
 * Manages state for:
 *   - Whether the staff details dialog is open
 *   - Which staff member is being edited (null for create mode)
 *   - Whether the service assignment dialog is open
 *   - Whether the hours editor dialog is open
 */

"use client";

import { useState } from "react";
import { Plus, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StaffCard } from "@/components/shared/staff-card";
import { StaffForm } from "@/components/forms/staff-form";
import { StaffServiceForm } from "@/components/forms/staff-service-form";
import { StaffHoursForm } from "@/components/forms/staff-hours-form";
import type { StaffFormValues } from "@/lib/validators/staff";

/** Shape of an assigned service for display. */
interface AssignedService {
  id: string;
  name: string;
}

/** Shape of a staff member's hours for a single day. */
interface StaffHoursData {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/** Shape of a staff member for display purposes. */
export interface StaffData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  image: string | null;
  isActive: boolean;
  bookingCount: number;
  assignedServices: AssignedService[];
  hours: StaffHoursData[];
}

/** Shape of a business service available for assignment. */
interface ServiceOption {
  id: string;
  name: string;
}

/** Props accepted by the StaffList component. */
interface StaffListProps {
  /** Array of staff members to display. */
  staff: StaffData[];
  /** Array of active business services for assignment. */
  services: ServiceOption[];
}

export function StaffList({ staff, services }: StaffListProps) {
  // Staff details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffData | null>(null);

  // Service assignment dialog state
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState<StaffData | null>(null);

  // Hours editor dialog state
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [schedulingStaff, setSchedulingStaff] = useState<StaffData | null>(
    null
  );

  // ---- Staff Details Handlers ----

  /** Opens the dialog in edit mode for the selected staff member. */
  function handleEdit(member: StaffData) {
    setEditingStaff(member);
    setDetailsDialogOpen(true);
  }

  /** Opens the dialog in create mode (empty form). */
  function handleAdd() {
    setEditingStaff(null);
    setDetailsDialogOpen(true);
  }

  /** Closes the details dialog and resets editing state. */
  function handleDetailsDialogClose() {
    setDetailsDialogOpen(false);
    setEditingStaff(null);
  }

  // ---- Service Assignment Handlers ----

  /** Opens the service assignment dialog for a staff member. */
  function handleManageServices(member: StaffData) {
    setAssigningStaff(member);
    setServicesDialogOpen(true);
  }

  /** Closes the service assignment dialog. */
  function handleServicesDialogClose() {
    setServicesDialogOpen(false);
    setAssigningStaff(null);
  }

  // ---- Hours Editor Handlers ----

  /** Opens the hours editor dialog for a staff member. */
  function handleSetHours(member: StaffData) {
    setSchedulingStaff(member);
    setHoursDialogOpen(true);
  }

  /** Closes the hours editor dialog. */
  function handleHoursDialogClose() {
    setHoursDialogOpen(false);
    setSchedulingStaff(null);
  }

  /**
   * Prepare form initial data from the staff member being edited.
   * Converts null values to empty strings for the form.
   */
  const editFormData: StaffFormValues | undefined = editingStaff
    ? {
        name: editingStaff.name,
        email: editingStaff.email ?? "",
        phone: editingStaff.phone ?? "",
        title: editingStaff.title ?? "",
      }
    : undefined;

  return (
    <>
      {/* Page header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff</h2>
          <p className="text-muted-foreground">
            Manage your team members. Assign services and set individual working
            hours for each staff member.
          </p>
        </div>

        {/* Add Staff dialog trigger */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff
                  ? "Update the details of your team member."
                  : "Add a new team member. You can assign services and set their schedule after creating them."}
              </DialogDescription>
            </DialogHeader>

            {/* Key forces React to re-mount the form when switching between
                create and edit mode, ensuring defaultValues are fresh. */}
            <StaffForm
              key={editingStaff?.id ?? "new"}
              initialData={editFormData}
              staffId={editingStaff?.id}
              onSuccess={handleDetailsDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff list or empty state */}
      {staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <UserCog className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No staff members yet</h3>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            Add your first team member to enable multi-provider scheduling.
            Customers will be able to book with specific staff members.
          </p>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Staff Member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onEdit={handleEdit}
              onManageServices={handleManageServices}
              onSetHours={handleSetHours}
            />
          ))}
        </div>
      )}

      {/* Service Assignment Dialog */}
      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Services — {assigningStaff?.name}</DialogTitle>
            <DialogDescription>
              Select which services this staff member can perform. Customers
              will only see staff who can perform the service they&apos;re
              booking.
            </DialogDescription>
          </DialogHeader>

          {assigningStaff && (
            <StaffServiceForm
              key={assigningStaff.id}
              staffId={assigningStaff.id}
              allServices={services}
              assignedServiceIds={assigningStaff.assignedServices.map(
                (s) => s.id
              )}
              onSuccess={handleServicesDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hours Editor Dialog */}
      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set Schedule — {schedulingStaff?.name}</DialogTitle>
            <DialogDescription>
              Set individual working hours for this staff member. Hours must be
              within your business operating hours.
            </DialogDescription>
          </DialogHeader>

          {schedulingStaff && (
            <StaffHoursForm
              key={schedulingStaff.id}
              staffId={schedulingStaff.id}
              existingHours={schedulingStaff.hours}
              onSuccess={handleHoursDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
