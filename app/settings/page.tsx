/**
 * Settings Page Component
 *
 * User preferences management interface.
 * Handles audio settings and avatar customization.
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

export default function SettingsPage() {
  const { user } = useAuth();
  const { updateUserSettings, settings, loading } = useDatabase();
  const [voiceOn, setVoiceOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
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
    } catch (err) {
      console.error("Failed to update avatar:", err);
      toast.error("Failed to update avatar. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Load settings from database
  useEffect(() => {
    if (settings) {
      setVoiceOn(settings.voice_on);
      if (settings.profile_picture) {
        setSelectedAvatar(getAvatarPath(settings.profile_picture));
      }
    }
  }, [settings]);

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
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Loading settings...</p>
        </main>
      </div>
    );
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

          <Card>
            <CardHeader>
              <CardTitle>Profile Customization</CardTitle>
              <CardDescription>Choose your avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer rounded-lg p-2 transition-all hover:bg-accent ${
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
