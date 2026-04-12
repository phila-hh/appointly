/**
 * @file Review Prompts Component
 * @description Shows completed bookings that need reviews.
 */

import Link from "next/link";
import { format } from "date-fns";
import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReviewPrompt {
  id: string;
  date: Date;
  business: {
    name: string;
  };
  service: {
    name: string;
  };
}

interface ReviewPromptsProps {
  bookings: ReviewPrompt[];
}

export function ReviewPrompts({ bookings }: ReviewPromptsProps) {
  if (bookings.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          Share Your Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          You have {bookings.length} completed booking
          {bookings.length > 1 ? "s" : ""} waiting for your review.
        </p>
        {bookings.slice(0, 2).map((booking) => (
          <div
            key={booking.id}
            className="flex items-center justify-between rounded-lg border bg-background p-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{booking.service.name}</p>
              <p className="text-xs text-muted-foreground">
                {booking.business.name} • {format(booking.date, "MMM d, yyyy")}
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/bookings/${booking.id}/review`}>Review</Link>
            </Button>
          </div>
        ))}
        {bookings.length > 2 && (
          <Button variant="link" size="sm" asChild className="h-auto p-0">
            <Link href="/bookings?status=COMPLETED">
              View all {bookings.length} bookings
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
