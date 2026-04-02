/**
 * @file Global Not Found Page
 * @description Custom 404 page displayed when a route doesn't match
 * any page or when notFound() is called from a page component.
 */

import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="mb-6 h-16 w-16 text-muted-foreground" />
      <h1 className="mb-2 text-3xl font-bold">Page Not Found</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been removed.
        Let&apos;s get you back on track.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse Services</Link>
        </Button>
      </div>
    </div>
  );
}
