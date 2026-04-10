/**
 * @file Recent Businesses Component
 * @description Grid of recently visited businesses for quick access.
 */

import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  image: string | null;
  city: string | null;
  state: string | null;
}

interface RecentBusinessesProps {
  businesses: RecentBusiness[];
}

export function RecentBusinesses({ businesses }: RecentBusinessesProps) {
  if (businesses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Recently Visited
          </CardTitle>
          <Link
            href="/browse"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Browse all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {businesses.map((business) => (
          <Link
            key={business.id}
            href={`/business/${business.slug}`}
            className="group"
          >
            <div className="flex gap-3 rounded-lg border p-3 transition-all hover:border-primary/30 hover:bg-muted/50">
              {/* Thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {business.image ? (
                  <Image
                    src={business.image}
                    alt={business.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1">
                {/* Name */}
                <p className="truncate text-sm font-medium leading-tight group-hover:text-primary">
                  {business.name}
                </p>

                {/* Category badge */}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {business.category}
                </Badge>

                {/* Location */}
                {(business.city || business.state) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {[business.city, business.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
