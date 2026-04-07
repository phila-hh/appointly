/**
 * @file User Avatar Component
 * @description Displays user avatar with image or initials fallback.
 *
 * This is a convenience wrapper around shadcn's Avatar component
 * that handles the initials logic automatically.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
}

/**
 * Extracts initials from a user's name.
 * "Marcus Johnson" → "MJ", "Elena" → "EL", null → "U"
 */
function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
