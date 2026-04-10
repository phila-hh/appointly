/**
 * @file Quick Rebook Component
 * @description One-click rebooking of the last completed service.
 */

import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickRebookProps {
  lastBooking: {
    business: {
      name: string;
      slug: string;
    };
    service: {
      id: string;
      name: string;
    };
  } | null;
}

export function QuickRebook({ lastBooking }: QuickRebookProps) {
  if (!lastBooking) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Rebook</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Book <span className="font-medium">{lastBooking.service.name}</span>{" "}
          at <span className="font-medium">{lastBooking.business.name}</span>{" "}
          again
        </p>
        <Button className="mt-4 w-full" asChild>
          <Link
            href={`/business/${lastBooking.business.slug}/book?service=${lastBooking.service.id}`}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Book Again
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
