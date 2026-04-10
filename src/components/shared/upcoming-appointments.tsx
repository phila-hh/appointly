/**
 * @file Upcoming Appointments Component
 * @description Displays the next 3 upcoming appointments on the dashboard.
 */

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, ArrowRight } from "lucide-react";

import { formatTime24to12 } from "@/constants/time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UpcomingAppointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  business: {
    name: string;
    slug: string;
  };
  service: {
    name: string;
  };
}

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[];
}

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No upcoming appointments. Browse services to book your next
            appointment.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/browse">Browse Services</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Appointments</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <Link
            key={appointment.id}
            href={`/bookings/${appointment.id}`}
            className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">{appointment.service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.business.name}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(appointment.date, "MMM d")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime24to12(appointment.startTime)}
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  appointment.status === "CONFIRMED" ? "default" : "secondary"
                }
              >
                {appointment.status}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
