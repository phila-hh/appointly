/**
 * @file Service Card Component
 * @description Display a single service with its details and management actions.
 *
 * Shows:
 *   - Service name with active/inactive badge
 *   - Description (truncated)
 *   - Price and duration
 *   - Edit button and active/inactive toggle
 *
 * Used on the dashboard service page for the business owner's catalogue.
 */

"use client";

import { useState } from "react";
import { Pencil, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { toggleServiceActive } from "@/lib/actions/service";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/** The shape of a service object as returned by Prisma. */
interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
}

/** Props accepted by the Service Card component. */
interface ServiceCardProps {
  /** The service data to display. */
  service: ServiceData;
  /** Called when the edit button is clicked. */
  onEdit: (service: ServiceData) => void;
}

export function ServiceCard({ service, onEdit }: ServiceCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  /** Handle active/inactive logic */
  async function handleToggle() {
    setIsToggling(true);

    try {
      const result = await toggleServiceActive(service.id);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      toast.error("Failed to update service status.");
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <Card className={!service.isActive ? "opacity-60" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{service.name}</CardTitle>
            <Badge variant={service.isActive ? "default" : "secondary"}>
              {service.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {service.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {service.description}
            </p>
          )}
        </div>

        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onEdit(service)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {service.name}</span>
        </Button>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          {/* Price and duration */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {formatPrice(service.price)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDuration(service.duration)}
            </span>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {service.isActive ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={service.isActive}
              onCheckedChange={handleToggle}
              disabled={isToggling}
              aria-label={`Toggle ${service.name} active status`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
