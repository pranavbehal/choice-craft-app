/**
 * Navigation Component
 *
 * Main navigation bar with dynamic routing and user status display.
 * Shows different navigation options based on authentication state.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Award, Settings } from "lucide-react";
import { LoginButton } from "./auth/LoginButton";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarPath } from "@/lib/utils";
import { useDatabase } from "@/hooks/useDatabase";
import Image from "next/image";
import { ClientWrapper } from "./client-wrapper";

/** Navigation link configuration */
const links = [
  { name: "Home", href: "/", icon: Home },
  { name: "Results", href: "/results", icon: Award, protected: true },
  { name: "Settings", href: "/settings", icon: Settings, protected: true },
];

function NavigationContent() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings } = useDatabase();

  /** Filter links based on user authentication status */
  const visibleLinks = links.filter((link) => !link.protected || user);

  return (
    <ClientWrapper>
      <nav className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="text-xl font-bold">
          Story Quest
        </Link>
        <div className="flex items-center space-x-6">
          {user && (
            <div className="flex items-center space-x-2">
              <Image
                src={
                  settings?.profile_picture
                    ? getAvatarPath(settings.profile_picture)
                    : getAvatarPath(1)
                }
                alt="User avatar"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm text-muted-foreground">
                {`Welcome, ${user.user_metadata.full_name}`}
              </span>
            </div>
          )}
          <div className="flex space-x-4">
            {visibleLinks.map((link) => {
              const LinkIcon = link.icon;
              return (
                <Button
                  key={link.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center justify-center h-16 w-16 text-xs",
                    pathname === link.href && "bg-muted"
                  )}
                  asChild
                >
                  <Link href={link.href}>
                    <LinkIcon className="h-5 w-5 mb-1" />
                    {link.name}
                  </Link>
                </Button>
              );
            })}
          </div>
          <LoginButton />
        </div>
      </nav>
    </ClientWrapper>
  );
}

export function Navigation() {
  return (
    <Suspense fallback={<div>Loading navigation...</div>}>
      <NavigationContent />
    </Suspense>
  );
}
