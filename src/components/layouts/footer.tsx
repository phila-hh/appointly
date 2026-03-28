/**
 * @file Footer Component
 * @description Site-wide for customer-facing pages.
 * Contains branding, navigation links, and copyright notice.
 * Excluded from the business dashboard layout.
 */

import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { SITE_CONFIG } from "@/constants";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">{SITE_CONFIG.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Book appointments with local service providers. Simple, fast, and
              reliable scheduling for everyone.
            </p>
          </div>

          {/* Product column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/browse"
                  className="transition-colors hover:text-foreground"
                >
                  Browse Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="transition-colors hover:text-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">For Business</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/sign-up"
                  className="transition-colors hover:text-foreground"
                >
                  List Your Business
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/overview"
                  className="transition-colors hover:text-foreground"
                >
                  Business Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="cursor-default">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-default">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
