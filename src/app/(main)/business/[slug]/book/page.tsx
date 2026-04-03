/**
 * @file Booking Page
 * @description Page where customers book an appointment with a business.
 *
 * Flow:
 *   1. Customer arrives from the business detail page (with ?service=ID)
 *   2. Page shows the selected service details
 *   3. Customer picks a date from the calendar
 *   4. Available time slots load dynamically
 *   5. Customer selects slot and optionally adds notes
 *   6. Customer confirms the booking
 *
 * URL: /business/[slug]/book?service=serviceId
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { getBusinessBySlug } from "@/lib/actions/public-queries";
import { getCurrentUser } from "@/lib/session";
import { BookingForm } from "@/components/forms/booking-form";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  return {
    title: business ? `Book at ${business.name}` : "Book Appointment",
  };
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { slug } = await params;
  const { service: serviceId } = await searchParams;

  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/browse");
  }

  // Fetch business
  const business = await getBusinessBySlug(slug);
  if (!business) {
    notFound();
  }

  // FInd the selected service
  const selectedService = serviceId
    ? business.services.find((s) => s.id === serviceId)
    : business.services[0]; // Default to first service

  if (!selectedService) {
    notFound();
  }

  // Serialize service data for client component
  const serviceData = {
    id: selectedService.id,
    name: selectedService.name,
    price: Number(selectedService.price),
    duration: selectedService.duration,
    description: selectedService.description,
  };

  // Serialize all service for the service selector
  const allServices = business.services.map((s) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    duration: s.duration,
    description: s.description,
  }));

  // Get business hours for the calendar (to disable closed days)
  const closedDays = business.BusinessHours.filter((h) => h.isClosed).map(
    (h) => h.dayOfWeek
  );

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Book an Appointment
          </h1>
          <p className="mt-1 text-muted-foreground">{business.name}</p>
        </div>
        {/* Booking form */}
        <BookingForm
          businessId={business.id}
          businessSlug={business.slug}
          selectedService={serviceData}
          allServices={allServices}
          closedDays={closedDays}
        />
      </div>
    </div>
  );
}
