/**
 * @file Dashboard Services Page
 * @description Service catalogue management for business owners.
 *
 * Features:
 *   - Display all services (active and inactive) as cards
 *   - "Add Service" button opens a dialog with the service form
 *   - Clicking the edit icon on a card opens the form pre-filled
 *   - Toggle switch to activate/deactivate service
 *   - Empty state when no services exists yet
 *
 * Architecture
 *   - This page is a server component that fetches services
 *   - It renders the ServiceList client component, passing data as props
 *   - ServiceList manages dialog state and renders cards
 *
 * URl: /dashboard/services
 */

import {
  requireBusiness,
  getBusinessServices,
} from "@/lib/actions/business-queries";
import { ServiceList } from "./service-list";

export const metadata = {
  title: "Services",
};

export default async function DashboardServicesPage() {
  // Ensure business exists (redirects to setup if not)
  await requireBusiness();

  // Fetch all services for this business
  const services = await getBusinessServices();

  /**
   * Serialize the service data for the client component.
   * Prisma Decimal types need to be converted to numbers/strings
   * because they aren't directly serializable as props.
   */
  const serializedServices = services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    duration: service.duration,
    isActive: service.isActive,
  }));

  return (
    <div className="space-y-6">
      <ServiceList services={serializedServices} />
    </div>
  );
}
