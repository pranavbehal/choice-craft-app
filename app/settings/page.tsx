/**
 * Settings Page Component
 *
 * User preferences management interface.
 * Handles audio settings, avatar customization, and display name.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { getAvatarPath } from "@/lib/utils";
import { QuestionButton } from "@/components/help/question-button";

/** Available avatar options */
const avatars = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
];

/**
 * Settings page skeleton loader component
 * Provides responsive loading state for settings page
 */
function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* Page title skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-24 sm:h-10 sm:w-32 mx-auto" />
        </div>

        {/* Settings cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 sm:h-4 sm:w-24" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-full sm:w-16" />
                </div>
                <Skeleton className="h-2 w-48 sm:h-3 sm:w-64" />
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-36 sm:h-4 sm:w-48" />
                <Skeleton className="h-5 w-10 sm:h-6 sm:w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Avatar Customization Card Skeleton */}
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="relative rounded-lg p-2">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { updateUserSettings, settings, loading } = useDatabase("settings");

  // Remove component key to prevent unnecessary re-mounts

  const [voiceOn, setVoiceOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);

  /**
   * Handles voice synthesis toggle
   * Updates user preferences in database
   * @param {boolean} enabled - New voice state
   */
  const handleVoiceToggle = async (enabled: boolean) => {
    if (updating) return;
    setUpdating(true);

    try {
      await updateUserSettings({ voice_on: enabled });
      setVoiceOn(enabled);
      toast.success("Voice settings updated");
    } catch (err) {
      console.error("Failed to update voice settings:", err);
      setVoiceOn(!enabled); // Revert on error
      toast.error("Failed to update voice settings. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handles avatar selection and update
   * @param {string} avatar - Path to selected avatar image
   */
  const handleAvatarSelect = async (avatar: string) => {
    if (updating) return;
    setUpdating(true);

    const avatarIndex = avatars.indexOf(avatar) + 1;
    try {
      await updateUserSettings({ profile_picture: avatarIndex });
      setSelectedAvatar(avatar);
      toast.success("Avatar updated");

      // Notify navigation to refresh user data
      window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
    } catch (err) {
      console.error("Failed to update avatar:", err);
      toast.error("Failed to update avatar. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handles display name update
   */
  const handleDisplayNameUpdate = async () => {
    if (updating || displayName.trim() === originalDisplayName) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast.error("Display name cannot be empty");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Display name must be 50 characters or less");
      return;
    }

    setUpdating(true);

    try {
      await updateUserSettings({ name: trimmedName });
      setOriginalDisplayName(trimmedName);
      toast.success("Display name updated");

      // Notify navigation to refresh user data
      window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
    } catch (err) {
      console.error("Failed to update display name:", err);
      setDisplayName(originalDisplayName); // Revert on error
      toast.error("Failed to update display name. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handles Enter key press in name input
   */
  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDisplayNameUpdate();
    }
  };

  // Load settings from database
  useEffect(() => {
    if (settings) {
      setVoiceOn(settings.voice_on);
      if (settings.profile_picture) {
        setSelectedAvatar(getAvatarPath(settings.profile_picture));
      }

      // Set display name with fallbacks
      const currentName =
        settings.name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "";
      setDisplayName(currentName);
      setOriginalDisplayName(currentName);
    }
  }, [settings, user]);

  if (authLoading) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Please sign in to access settings.</p>
        </main>
      </div>
    );
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-center mb-8 text-primary">
          Settings
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Customize your display name and identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyPress={handleNameKeyPress}
                    placeholder="Enter your display name"
                    maxLength={50}
                    disabled={updating}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleDisplayNameUpdate}
                    disabled={
                      updating ||
                      displayName.trim() === originalDisplayName ||
                      !displayName.trim()
                    }
                    size="sm"
                  >
                    {updating ? "Saving..." : "Save"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This name will be displayed throughout the app and on
                  leaderboards
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audio Settings</CardTitle>
              <CardDescription>Configure game audio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-enabled">
                  Enable Narration (turn your volume up!)
                </Label>
                <Switch
                  id="voice-enabled"
                  checked={voiceOn}
                  onCheckedChange={handleVoiceToggle}
                  disabled={updating}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Avatar Customization</CardTitle>
              <CardDescription>Choose your avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer rounded-lg p-2 transition-all hover:bg-accent flex items-center justify-center ${
                      selectedAvatar === avatar
                        ? "ring-2 ring-primary bg-accent"
                        : ""
                    } ${updating ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    <Image
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <QuestionButton />
    </div>
  );
}
