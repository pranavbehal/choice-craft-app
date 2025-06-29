import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const helpTopics = [
  {
    title: "Getting Started",
    content:
      "Welcome to Choice Craft! Sign in with your Google account to begin your adventure. Once logged in, you'll see four unique missions to choose from on the home page. Each mission has a clear storyline with defined completion milestones, but you can continue exploring beyond 100% completion for extended adventures.",
  },
  {
    title: "Mission System & Storylines",
    content:
      "Each mission features a structured storyline with progression tracking. Complete the main story to reach 100% completion, then optionally continue with your AI companion for unlimited exploration. Your choices shape the narrative through diplomatic, strategic, action, or investigation decisions. Progress is automatically saved, and you can resume missions anytime from where you left off.",
  },
  {
    title: "Interactive Chat & Controls",
    content:
      "Communicate with your AI companions using natural language in the chat box. Each companion (Professor Blue, Captain Nova, Fairy Lumi, Sergeant Nexus) has unique personalities and voices. Type 'stop' to end a mission early, or simply continue chatting to progress the story. Your responses influence both the narrative and your decision-making statistics.",
  },
  {
    title: "Voice & Visual Experience",
    content:
      "Enable voice narration in Settings to hear your companions speak with unique ElevenLabs AI voices. Watch as AI-generated background images dynamically change based on your story progression, creating an immersive visual experience. All audio and visual settings are customizable and saved automatically.",
  },
  {
    title: "Profile & Settings",
    content:
      "Customize your experience in the Settings page. Set your display name (shown on leaderboards), choose from multiple avatar options, and toggle voice narration. Your display name can be different from your Google account name and is used throughout the app and leaderboards.",
  },
  {
    title: "Results & Analytics",
    content:
      "The Results page provides comprehensive mission analytics including completion rates, decision patterns, playing style analysis, and achievement tracking. View detailed charts of your progress, export your data for analysis, and track your XP and level progression. Filter results by specific missions or view overall statistics.",
  },
  {
    title: "Leaderboard & Competition",
    content:
      "Compare your progress with other players on the Leaderboard page. Rankings are based on total XP earned through mission completion and achievements. View top performers, recent activity, and see how your playing style compares to others. Your display name from Settings is shown on leaderboards.",
  },
  {
    title: "Achievement System",
    content:
      "Unlock achievements by completing missions, making specific types of decisions, and reaching milestones. Achievements are categorized by rarity (Common, Rare, Epic, Legendary) and provide XP rewards that contribute to your level and leaderboard ranking. Track your progress toward locked achievements in the Results page.",
  },
  {
    title: "FBLA Prompt Correlation",
    content:
      "The prompt for this project was to create an interactive story that takes the user's input to change the story's outcomes, while allowing the user to stop the story at any time. I expanded on this prompt to create a fully-functioning, production-grade application that includes immersive storytelling via AI-powered interactions, real-time visuals and narrations, and comprehensive progress tracking. I also added a leaderboard and achievement system to gamify the application.",
  },
];

export function HelpMenu() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="h-[55vh] md:h-[65vh] overflow-y-auto px-1">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {helpTopics.map((topic, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline text-left py-4">
                <span className="font-medium text-sm md:text-base break-words">
                  {topic.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base break-words">
                  {topic.content}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
