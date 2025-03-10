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
      "Welcome to Story Quest! Sign in to begin your adventure. Once logged in, you'll see four unique missions to choose from. Click any mission card to start your journey.",
  },
  {
    title: "Mission Controls",
    content:
      "During missions, type your responses in the chat box at the bottom of the screen. Use natural language to interact with your AI companion. Type 'stop' at any time to end the mission.",
  },
  {
    title: "Voice & Settings",
    content:
      "Visit Settings to customize your experience. Enable voice narration to hear your companions speak, and choose your preferred avatar. All settings are saved automatically.",
  },
  {
    title: "Progress Tracking",
    content:
      "Check the Results page to view detailed statistics about your missions. You can see your decision patterns, achievements, and download your progress data for analysis.",
  },
];

export function HelpMenu() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {helpTopics.map((topic, index) => (
        <AccordionItem value={`item-${index}`} key={index}>
          <AccordionTrigger>{topic.title}</AccordionTrigger>
          <AccordionContent>{topic.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
