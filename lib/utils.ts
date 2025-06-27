import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarPath(profilePicture: number = 1) {
  return `/avatars/avatar-${profilePicture}.png`;
}

/**
 * Gets the user's display name, prioritizing database name over auth metadata
 * @param databaseName - Name from the users table in database
 * @param authUser - Supabase auth user object
 * @returns The best available display name for the user
 */
export function getUserDisplayName(
  databaseName?: string | null,
  authUser?: User | null
): string {
  if (databaseName) {
    return databaseName;
  }

  if (authUser) {
    return (
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      `Player ${authUser.id.slice(-4)}`
    );
  }

  return "User";
}
