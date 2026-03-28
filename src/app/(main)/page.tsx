/**
 * @file Landing Page
 * @description The home page of Appointly — the first thing visitors see.
 *
 * Sections:
 *   1. Hero — headline, description, and call-to-action buttons
 *  2. Features — key platform capabilities grid
 *   3. How It Works — step by step process explanation
 *   4. Categories — business categories supported
 *   5. CTA — final call-to-action sign up
 *
 * This is a Server Component — no client-side Javascript needed.
 * All content is static, which is great for SEO and performance.
 *
 * URL: /
 */

import Link from "next/link";
import {
  CalendarCheck,
  Search,
  Clock,
  CreditCard,
  Star,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES } from "@/constants";

export default function HomePage() {
  return (
    <>
      {/* ================================================================== */}
      {/* HERO SECTION                                                        */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden border-b bg-linear-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status badge */}
            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5 text-sm"
            >
              <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
              Trusted by 500+ local businesses
            </Badge>

            {/* Main headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Book Local Services{" "}
              <span className="text-primary">In Seconds</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Discover and book appointments with local service providers. From
              barbershops to wellness spas, find the perfect service and
              schedule your visit — all in one place.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/browse">Browse Services</Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Free to get started
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Set up in under 5 minutes
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient blur elements */}
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* ================================================================== */}
      {/* FEATURES SECTION                                                    */}
      {/* ================================================================== */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Manage Appointments
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you&apos;re a customer looking to book or a business owner
            managing your schedule, Appointly has you covered.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border bg-card transition-shadow hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS SECTION                                                */}
      {/* ================================================================== */}
      <section id="how-it-works" className="border-y bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps — whether you&apos;re booking a
              service or listing your business.
            </p>
          </div>

          {/* Customer steps */}
          <div className="mx-auto mt-16 max-w-4xl">
            <h3 className="mb-8 text-center text-lg font-semibold">
              For Customers
            </h3>
            <div className="grid gap-8 sm:grid-cols-3">
              {CUSTOMER_STEPS.map((step, index) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h4 className="mb-2 font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Business owner steps */}
          <div className="mx-auto mt-16 max-w-4xl">
            <h3 className="mb-8 text-center text-lg font-semibold">
              For Business Owners
            </h3>
            <div className="grid gap-8 sm:grid-cols-3">
              {BUSINESS_STEPS.map((step, index) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-xl font-bold text-primary">
                    {index + 1}
                  </div>
                  <h4 className="mb-2 font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CATEGORIES SECTION                                                  */}
      {/* ================================================================== */}
      <section
        id="about"
        className="container mx-auto px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Services for Every Need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Appointly supports a wide range of service-based businesses.
            Whatever you need, find it here.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
          {Object.values(BUSINESS_CATEGORIES).map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="rounded-full px-4 py-2 text-sm"
            >
              {category}
            </Badge>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* CALL TO ACTION SECTION                                              */}
      {/* ================================================================== */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join hundreds of businesses and thousands of customers already
              using Appointly to simplify their scheduling.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/browse">Explore Businesses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// =============================================================================
// Static Data — defined outside the component to avoid re-creation on render
// =============================================================================

/** Features displayed in the features grid section. */
const FEATURES = [
  {
    icon: Search,
    title: "Easy Discovery",
    description:
      "Browse local service providers by category, location, and ratings. Find exactly what you need in seconds.",
  },
  {
    icon: Clock,
    title: "Real-Time Availability",
    description:
      "See up-to-date availability and book open time slots instantly. No back-and-forth phone calls.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Pay for your appointments online with confidence. Powered by Stripe for industry-leading security.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description:
      "Read authentic reviews from real customers. Only people who completed a booking can leave feedback.",
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    description:
      "Track bookings, revenue, and customer trends with a powerful dashboard. Make data-driven decisions.",
  },
  {
    icon: Shield,
    title: "Reliable & Secure",
    description:
      "Built with modern security practices. Your data is encrypted, your passwords are hashed, your payments are protected.",
  },
] as const;

/** Steps for the "How It Works" section — customer flow. */
const CUSTOMER_STEPS = [
  {
    title: "Find a Service",
    description:
      "Browse businesses by category or search for a specific service in your area.",
  },
  {
    title: "Book a Time Slot",
    description:
      "Pick a date, choose an available time that works for you, and confirm your appointment.",
  },
  {
    title: "Show Up & Enjoy",
    description:
      "Receive a confirmation, show up at your appointment time, and leave a review afterwards.",
  },
] as const;

/** Steps for the "How It Works" section — business owner flow. */
const BUSINESS_STEPS = [
  {
    title: "Set Up Your Profile",
    description:
      "Create your business profile, add your services with pricing, and set your availability.",
  },
  {
    title: "Receive Bookings",
    description:
      "Customers discover your business and book appointments. You get notified instantly.",
  },
  {
    title: "Grow Your Business",
    description:
      "Manage bookings, track revenue, and build your reputation with customer reviews.",
  },
] as const;
