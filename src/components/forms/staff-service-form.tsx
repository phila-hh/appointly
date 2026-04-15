/**
 * @file Staff Service Assignment Form
 * @description Checkbox-based form for assigning services to a staff member.
 * Designed to be rendered inside a dialog component.
 *
 * Displays all active business services as a checkbox list. Pre-checks
 * services already assigned to the staff member. On submit, replaces
 * all assignments atomically.
 *
 * Uses local state for checkbox management rather than react-hook-form,
 * as a simple checkbox list doesn't benefit from the form library's
 * field-level validation and error handling.
 */

"use client";

import { useState } from "react";
import { Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";

import { updateStaffServices } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** Shape of a service option for the checkbox list. */
interface ServiceOption {
  id: string;
  name: string;
}

/** Props accepted by the StaffServiceForm component. */
interface StaffServiceFormProps {
  /** The staff member's ID. */
  staffId: string;
  /** All active business services. */
  allServices: ServiceOption[];
  /** IDs of services already assigned to this staff member. */
  assignedServiceIds: string[];
  /** Called after a successful update so parent can close dialog. */
  onSuccess?: () => void;
}

export function StaffServiceForm({
  staffId,
  allServices,
  assignedServiceIds,
  onSuccess,
}: StaffServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(assignedServiceIds)
  );

  /** Toggle a service selection on/off. */
  function toggleService(serviceId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }

  /** Select or deselect all services. */
  function handleSelectAll() {
    if (selectedIds.size === allServices.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(allServices.map((s) => s.id)));
    }
  }

  /** Handle form submission. */
  async function handleSubmit() {
    if (selectedIds.size === 0) {
      toast.error("Please assign at least one service.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateStaffServices({
        staffId,
        serviceIds: Array.from(selectedIds),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        onSuccess?.();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const allSelected = selectedIds.size === allServices.length;

  return (
    <div className="space-y-4">
      {allServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Scissors className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No active services found. Add services to your business first.
          </p>
        </div>
      ) : (
        <>
          {/* Select all toggle */}
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {allServices.length} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Service checkbox list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {allServices.map((service) => {
              const isChecked = selectedIds.has(service.id);

              return (
                <label
                  key={service.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 has-checked:border-primary has-checked:bg-accent/30"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleService(service.id)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label className="cursor-pointer text-sm font-medium">
                    {service.name}
                  </Label>
                </label>
              );
            })}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedIds.size === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Assignments"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
