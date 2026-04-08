/**
 * @file Booking Timeline Component
 * @description Visual timeline showing the progression of a booking.
 *
 * Display events like:
 *   - Booking created
 *   - Payment  completed
 *   - Booking confirmed
 *   - Service completed
 *   - Review submitted
 *
 * Events are marked as complete, current, or upcoming based on status.
 */

import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

interface TimelineEvent {
  label: string;
  timestamp: Date;
  status: "complete" | "current" | "upcoming";
}

interface BookingTimelineProps {
  events: TimelineEvent[];
}

export function BookingTimeline({ events }: BookingTimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isComplete = event.status === "complete";

        return (
          <div key={index} className="relative flex gap-4">
            {/* Timeline line — only show if not the last event */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-2.5 top-6 h-full w-0.5",
                  isComplete ? "bg-primary" : "bg-muted"
                )}
              />
            )}

            {/* Event icon */}
            <div className="relative z-10 shrink-0">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Event details */}
            <div className="flex-1 pb-4">
              <div
                className={cn(
                  " font-medium",
                  isComplete ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {event.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
