/**
 * @file Top Customers List Component
 * @description Shows customers ranked by total spending or booking count.
 *
 * Features:
 *   - Top 10 customers
 *   - Total spent and booking count
 *   - Avatar display
 *   - Sortable by spending or bookings
 */

"use client";

import { Crown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatPrice } from "@/lib/utils";

interface TopCustomer {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  totalSpent: number;
  bookingCount: number;
}

interface TopCustomersListProps {
  customers: TopCustomer[];
  title?: string;
  sortBy?: "spending" | "bookings";
}

export function TopCustomersList({
  customers,
  title = "Top Customers",
  sortBy = "spending",
}: TopCustomersListProps) {
  if (customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No customer data for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort customers
  const sortedCustomers = [...customers]
    .sort((a, b) => {
      if (sortBy === "spending") {
        return b.totalSpent - a.totalSpent;
      }
      return b.bookingCount - a.bookingCount;
    })
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCustomers.map((customer, index) => (
            <div
              key={customer.id}
              className="flex items-center justify-between gap-4"
            >
              {/* Rank badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                      : index === 1
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        : index === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </span>

                {/* Customer info */}
                <UserAvatar
                  name={customer.name}
                  image={customer.image}
                  className="h-10 w-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {customer.name ?? "Anonymous"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {customer.email}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatPrice(customer.totalSpent)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customer.bookingCount} booking
                  {customer.bookingCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
