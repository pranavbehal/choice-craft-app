import { Mission } from "@/types";

/** Available missions with their metadata and structured storylines */
export const missions: Mission[] = [
  {
    id: "670a8cdc-8961-438b-b67f-1b259767d8c5",
    title: "The Lost City",
    description: "Uncover the secrets of an ancient civilization",
    companion: "Professor Blue",
    image: "/mission-images/mission-1.jpg",
    difficulty: "Beginner" as const,
    storyline: {
      opening:
        "You and Professor Blue discover ancient ruins hidden deep in the jungle. Strange symbols glow on weathered stone walls, and the air hums with mysterious energy.",
      milestones: [
        {
          progress: 25,
          event:
            "Decipher the ancient entrance puzzle and gain access to the outer chambers",
          description:
            "The first barrier is overcome - you've proven worthy to enter the sacred city",
        },
        {
          progress: 50,
          event:
            "Navigate the temple's defensive mechanisms and reach the inner sanctum",
          description:
            "Halfway through your journey, ancient guardians test your wisdom and courage",
        },
        {
          progress: 75,
          event:
            "Unlock the central vault and discover the city's greatest secret",
          description:
            "The truth about the civilization's mysterious disappearance is revealed",
        },
        {
          progress: 100,
          event:
            "Choose the fate of the ancient knowledge - preserve, share, or protect it from the world",
          description:
            "Your final decision determines the legacy of the lost civilization",
        },
      ],
    },
  },
  {
    id: "b2fa59e6-d406-4c51-8b99-00e72c2a3a10",
    title: "Space Odyssey",
    description: "Navigate through an asteroid field in your spaceship",
    companion: "Captain Nova",
    image: "/mission-images/mission-2.jpg",
    difficulty: "Intermediate" as const,
    storyline: {
      opening:
        "Emergency klaxons blare as Captain Nova reports massive asteroid field ahead. Your ship's navigation is failing, and a distress signal echoes from somewhere deep within the deadly space debris.",
      milestones: [
        {
          progress: 25,
          event:
            "Successfully navigate the outer asteroid ring and locate the source of the distress signal",
          description:
            "Initial piloting skills tested - you've found survivors but danger still surrounds you",
        },
        {
          progress: 50,
          event:
            "Rescue the stranded crew while avoiding collisions with massive asteroids",
          description:
            "Rescue operations underway, but the asteroid field is becoming more unstable",
        },
        {
          progress: 75,
          event:
            "Discover the cause of the field's instability and find a way to stabilize it",
          description:
            "The mystery deepens - this isn't a natural phenomenon, and time is running out",
        },
        {
          progress: 100,
          event:
            "Execute the final escape plan and determine the fate of the asteroid field",
          description:
            "Final moments - your decisions affect both the rescued crew and future space travelers",
        },
      ],
    },
  },
  {
    id: "82761887-a4c7-4bd7-921a-4f0a3c18a558",
    title: "Enchanted Forest",
    description: "Break the curse hurting magical creatures",
    companion: "Fairy Lumi",
    image: "/mission-images/mission-3.jpg",
    difficulty: "Advanced" as const,
    storyline: {
      opening:
        "Fairy Lumi's wings flicker weakly as she leads you into a dying forest. The trees wither, magical creatures flee in terror, and an ancient curse spreads like a plague through the enchanted realm.",
      milestones: [
        {
          progress: 25,
          event:
            "Identify the curse's origin and gain the trust of the forest's remaining magical inhabitants",
          description:
            "First allies gathered - unicorns, sprites, and talking trees offer their wisdom",
        },
        {
          progress: 50,
          event:
            "Confront the dark magic at its source and begin weakening the curse's hold",
          description:
            "The curse fights back fiercely, testing your magical knowledge and resolve",
        },
        {
          progress: 75,
          event:
            "Gather the three sacred elements needed to break the curse permanently",
          description:
            "Ancient magic demands sacrifice - not all choices will be easy to make",
        },
        {
          progress: 100,
          event:
            "Perform the ritual to break the curse and restore the forest to its former glory",
          description:
            "The fate of the enchanted realm rests in your hands - will nature triumph over darkness?",
        },
      ],
    },
  },
  {
    id: "e5b455a2-9f57-448f-a0f9-7dd873fb0dfd",
    title: "Cyber Heist",
    description: "Infiltrate a high-security digital vault",
    companion: "Sergeant Nexus",
    image: "/mission-images/mission-4.jpg",
    difficulty: "Expert" as const,
    storyline: {
      opening:
        "Sergeant Nexus's cybernetic implants glow as he interfaces with the corporate network. The digital vault contains evidence of global corruption, but layers of deadly AI security stand between you and the truth.",
      milestones: [
        {
          progress: 25,
          event:
            "Bypass the outer firewall and infiltrate the corporate mainframe undetected",
          description:
            "First security layer breached - but the real defenses are just awakening",
        },
        {
          progress: 50,
          event:
            "Navigate through the AI guardian protocols and reach the restricted data sectors",
          description:
            "Digital battles rage as you fight hostile programs in cyberspace",
        },
        {
          progress: 75,
          event:
            "Locate and decrypt the vault containing the incriminating evidence",
          description:
            "The truth is within reach, but the corporation's deadliest countermeasures activate",
        },
        {
          progress: 100,
          event:
            "Escape with the evidence and decide how to expose the conspiracy to the world",
          description:
            "Mission complete - your choices determine how justice will be served",
        },
      ],
    },
  },
];
