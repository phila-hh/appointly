/**
 * @file Seed admin audit logs — realistic admin activity history.
 */

import { getPrisma, d } from "./helpers";
import type { SeedUser } from "./users";
import type { SeededBusiness } from "./businesses";

export async function seedAuditLogs(
  admins: SeedUser[],
  businesses: SeededBusiness[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("📋 Creating admin audit logs...");

  const logs: Array<{
    adminId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: object;
    createdAt: Date;
  }> = [
    // Platform settings changes
    {
      adminId: admins[0].id,
      action: "UPDATE_PLATFORM_SETTINGS",
      entityType: "PlatformSettings",
      metadata: { field: "defaultCommissionRate", from: 0.08, to: 0.1 },
      createdAt: d(2025, 7, 5),
    },
    {
      adminId: admins[0].id,
      action: "UPDATE_PLATFORM_SETTINGS",
      entityType: "PlatformSettings",
      metadata: { field: "payoutSchedule", from: "WEEKLY", to: "MONTHLY" },
      createdAt: d(2025, 7, 15),
    },
    // Business approvals
    {
      adminId: admins[0].id,
      action: "ACTIVATE_BUSINESS",
      entityType: "Business",
      entityId: businesses[3].id,
      metadata: { reason: "Verified documents submitted" },
      createdAt: d(2025, 7, 10),
    },
    {
      adminId: admins[1].id,
      action: "ACTIVATE_BUSINESS",
      entityType: "Business",
      entityId: businesses[7].id,
      metadata: { reason: "Background check passed" },
      createdAt: d(2025, 8, 3),
    },
    {
      adminId: admins[0].id,
      action: "DEACTIVATE_BUSINESS",
      entityType: "Business",
      entityId: businesses[51].id,
      metadata: { reason: "Business requested temporary suspension" },
      createdAt: d(2025, 9, 20),
    },
    // User management
    {
      adminId: admins[1].id,
      action: "SUSPEND_USER",
      entityType: "User",
      metadata: { reason: "Multiple policy violations reported" },
      createdAt: d(2025, 8, 14),
    },
    {
      adminId: admins[0].id,
      action: "REINSTATE_USER",
      entityType: "User",
      metadata: { reason: "Review completed, no policy breach found" },
      createdAt: d(2025, 8, 28),
    },
    // Payout management
    {
      adminId: admins[0].id,
      action: "TRIGGER_PAYOUT",
      entityType: "Payout",
      metadata: { period: "2025-08", businessCount: 12 },
      createdAt: d(2025, 9, 1),
    },
    {
      adminId: admins[1].id,
      action: "TRIGGER_PAYOUT",
      entityType: "Payout",
      metadata: { period: "2025-09", businessCount: 15 },
      createdAt: d(2025, 10, 1),
    },
    {
      adminId: admins[0].id,
      action: "RESOLVE_FAILED_PAYOUT",
      entityType: "Payout",
      metadata: {
        period: "2025-09",
        error: "incorrect_account",
        resolution: "updated_bank_details",
      },
      createdAt: d(2025, 10, 5),
    },
    {
      adminId: admins[1].id,
      action: "TRIGGER_PAYOUT",
      entityType: "Payout",
      metadata: { period: "2025-10", businessCount: 18 },
      createdAt: d(2025, 11, 1),
    },
    {
      adminId: admins[0].id,
      action: "TRIGGER_PAYOUT",
      entityType: "Payout",
      metadata: { period: "2025-11", businessCount: 20 },
      createdAt: d(2025, 12, 1),
    },
    {
      adminId: admins[1].id,
      action: "TRIGGER_PAYOUT",
      entityType: "Payout",
      metadata: { period: "2025-12", businessCount: 22 },
      createdAt: d(2026, 1, 2),
    },
    // Review moderation
    {
      adminId: admins[0].id,
      action: "REMOVE_REVIEW",
      entityType: "Review",
      metadata: { reason: "Spam content detected by AI filter" },
      createdAt: d(2025, 9, 8),
    },
    {
      adminId: admins[1].id,
      action: "REMOVE_REVIEW",
      entityType: "Review",
      metadata: { reason: "Confirmed fake review from competitor" },
      createdAt: d(2025, 10, 22),
    },
    {
      adminId: admins[0].id,
      action: "FLAG_REVIEW",
      entityType: "Review",
      metadata: { reason: "Potentially defamatory content under review" },
      createdAt: d(2025, 11, 15),
    },
    // Commission adjustments
    {
      adminId: admins[1].id,
      action: "ADJUST_COMMISSION",
      entityType: "Commission",
      metadata: {
        reason: "Correction for duplicate charge on refunded booking",
      },
      createdAt: d(2025, 10, 18),
    },
    {
      adminId: admins[0].id,
      action: "WAIVE_COMMISSION",
      entityType: "Commission",
      entityId: businesses[0].id,
      metadata: {
        reason: "New business promotional period — 0% for first month",
      },
      createdAt: d(2025, 7, 1),
    },
    // System events
    {
      adminId: admins[0].id,
      action: "EXPORT_REPORT",
      entityType: "Report",
      metadata: { type: "monthly_revenue", period: "2025-Q3" },
      createdAt: d(2025, 10, 3),
    },
    {
      adminId: admins[1].id,
      action: "EXPORT_REPORT",
      entityType: "Report",
      metadata: { type: "monthly_revenue", period: "2025-Q4" },
      createdAt: d(2026, 1, 4),
    },
    {
      adminId: admins[0].id,
      action: "SEND_PLATFORM_ANNOUNCEMENT",
      entityType: "System",
      metadata: {
        title: "New feature: Staff management is now live!",
        sentTo: "all_users",
      },
      createdAt: d(2025, 8, 20),
    },
    {
      adminId: admins[1].id,
      action: "SEND_PLATFORM_ANNOUNCEMENT",
      entityType: "System",
      metadata: {
        title: "Scheduled maintenance on 2025-11-01 02:00–04:00 EAT",
        sentTo: "all_users",
      },
      createdAt: d(2025, 10, 28),
    },
    {
      adminId: admins[0].id,
      action: "UPDATE_PLATFORM_SETTINGS",
      entityType: "PlatformSettings",
      metadata: { field: "maintenanceMode", from: false, to: true },
      createdAt: d(2025, 11, 1),
    },
    {
      adminId: admins[0].id,
      action: "UPDATE_PLATFORM_SETTINGS",
      entityType: "PlatformSettings",
      metadata: { field: "maintenanceMode", from: true, to: false },
      createdAt: d(2025, 11, 1),
    },
    {
      adminId: admins[1].id,
      action: "TRIGGER_PAYOUT",
      entityType: "Payout",
      metadata: { period: "2026-01", businessCount: 28 },
      createdAt: d(2026, 2, 1),
    },
    {
      adminId: admins[0].id,
      action: "EXPORT_REPORT",
      entityType: "Report",
      metadata: { type: "annual_summary", period: "2025" },
      createdAt: d(2026, 1, 15),
    },
  ];

  for (const log of logs) {
    await prisma.adminAuditLog.create({ data: log });
  }

  console.log(`✅ Created ${logs.length} admin audit log entries.\n`);
}
