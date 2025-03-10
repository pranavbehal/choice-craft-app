import { Mission } from "@/types";

/** Available missions with their metadata */
export const missions: Mission[] = [
  {
    id: "670a8cdc-8961-438b-b67f-1b259767d8c5",
    title: "The Lost City",
    description: "Uncover the secrets of an ancient civilization",
    companion: "Professor Blue",
    image: "/mission-images/mission-1.jpg",
    difficulty: "Beginner" as const,
  },
  {
    id: "b2fa59e6-d406-4c51-8b99-00e72c2a3a10",
    title: "Space Odyssey",
    description: "Navigate through an asteroid field in your spaceship",
    companion: "Captain Nova",
    image: "/mission-images/mission-2.jpg",
    difficulty: "Intermediate" as const,
  },
  {
    id: "82761887-a4c7-4bd7-921a-4f0a3c18a558",
    title: "Enchanted Forest",
    description: "Break the curse hurting magical creatures",
    companion: "Fairy Lumi",
    image: "/mission-images/mission-3.jpg",
    difficulty: "Advanced" as const,
  },
  {
    id: "e5b455a2-9f57-448f-a0f9-7dd873fb0dfd",
    title: "Cyber Heist",
    description: "Infiltrate a high-security digital vault",
    companion: "Sergeant Nexus",
    image: "/mission-images/mission-4.jpg",
    difficulty: "Expert" as const,
  },
];
