/**
 * @file Service List Component
 * @description Client component managing the service list display and
 * the add/edit service dialog.
 *
 * Manages state for:
 *   - Whether the dialog is open or closed
 *   - Which service is being edited (null for create mode)
 */

"use client";

import { useState } from "react";
import { Plus, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ServiceCard } from "@/components/shared/service-card";
import { ServiceForm } from "@/components/forms/service-form";
import type { ServiceFormValues } from "@/lib/validators/service";

/** Shape of a service for display purposes. */
interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
}

/** Props accepted by the ServiceList component. */
interface ServiceListProps {
  /** Array of services to display. */
  services: ServiceData[];
}

export function ServiceList({ services }: ServiceListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null
  );

  /**
   * Opens the dialog in edit mode for the selected service.
   * Converts the service data to form values format.
   */
  function handleEdit(service: ServiceData) {
    setEditingService(service);
    setDialogOpen(true);
  }

  /** Opens the dialog in create mode (empty form). */
  function handleAdd() {
    setEditingService(null);
    setDialogOpen(true);
  }

  /** Closes the dialog and resets the editing state. */
  function handleDialogClose() {
    setDialogOpen(false);
    setEditingService(null);
  }

  /**
   * Prepare form initial data from the service being edited.
   * Converts null description to empty string for the form.
   */
  const editFormData: ServiceFormValues | undefined = editingService
    ? {
        name: editingService.name,
        description: editingService.description ?? "",
        price: editingService.price,
        duration: editingService.duration,
      }
    : undefined;

  return (
    <>
      {/* Page header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground">
            Manage your service catalogue. Customers will see active services on
            your business page.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? "Update the details of your service."
                  : "Add a new service to your catalogue. It will be visible to customers immediately."}
              </DialogDescription>
            </DialogHeader>

            {/* Key forces React to re-mount the form when switching between
                create and edit mode, ensuring defaultValues are fresh. */}
            <ServiceForm
              key={editingService?.id ?? "new"}
              initialData={editFormData}
              serviceId={editingService?.id}
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Service list or empty state */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No services yet</h3>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            Add your first service to start receiving bookings from customers.
          </p>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Service
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </>
  );
}
