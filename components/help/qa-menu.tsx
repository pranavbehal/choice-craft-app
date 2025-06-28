"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I start a mission?",
    answer:
      "From the home page, click on any mission card to begin. You'll need to be signed in with your Google account first. Each mission has a unique companion, storyline, and theme. If you have previous progress on a mission, you'll be prompted to either resume from where you left off or start fresh.",
  },
  {
    question: "What happens when I complete 100% of a mission?",
    answer:
      "Completing 100% means you've finished the main storyline, but the adventure doesn't end there! You can continue chatting with your AI companion for extended exploration and alternative story paths. Your progress percentage won't increase beyond 100%, but you can enjoy unlimited additional content.",
  },
  {
    question: "How do I change my display name and avatar?",
    answer:
      "Go to Settings to customize your profile. You can set a display name (different from your Google account name) that appears on leaderboards and throughout the app. Choose from multiple avatar options - your selection is saved automatically and displayed in all missions and on the leaderboard.",
  },
  {
    question: "How does voice narration work?",
    answer:
      "Enable voice narration in Settings to hear your companions speak with unique ElevenLabs AI voices. Each companion (Professor Blue, Captain Nova, Fairy Lumi, Sergeant Nexus) has a distinct voice that matches their character. Make sure your device's volume is on and audio is enabled in your browser.",
  },
  {
    question: "How do I end a mission early?",
    answer:
      "Simply type 'stop' in the chat box at any time during a mission, or simply leave the page. If you type 'stop', you will see a countdown timer before being redirected to the home page. Your progress is automatically saved, so you can resume the mission later from where you left off.",
  },
  {
    question: "What can I see on the Results page?",
    answer:
      "The Results page shows comprehensive analytics including mission completion rates, decision-making patterns, achievements earned, XP and level progression, and detailed charts of your progress. You can filter results by specific missions, export your data for analysis, and track your playing style development over time.",
  },
  {
    question: "How does the leaderboard work?",
    answer:
      "The Leaderboard ranks players based on total XP earned through mission completion and achievements. It shows top performers, recent activity, and allows you to compare your progress with other players. Your display name from Settings is what appears on the leaderboard.",
  },
  {
    question: "What are achievements and how do I earn them?",
    answer:
      "Achievements are special milestones you unlock by completing missions, making specific types of decisions, or reaching certain goals. They're categorized by rarity (Common, Rare, Epic, Legendary) and provide XP rewards that boost your level and leaderboard ranking. View your achievements and track progress toward locked ones in the Results page.",
  },
  {
    question: "How do decision types affect my gameplay?",
    answer:
      "Your choices are categorized into four types: Diplomatic (peaceful solutions), Strategic (planning-focused), Action (direct approaches), and Investigation (research-oriented). These patterns are tracked and displayed in your Results analytics, helping you understand your playing style and decision-making tendencies.",
  },
  {
    question: "Can I export my game data?",
    answer:
      "Yes! The Results page includes options to export your progress data for external analysis. This includes mission statistics, decision patterns, achievements, and other gameplay metrics that you can use for personal tracking or analysis.",
  },
  {
    question: "What makes each mission companion unique?",
    answer:
      "Each companion has a distinct personality, voice, and expertise: Professor Blue (Lost City - archaeological expertise), Captain Nova (Space Odyssey - space exploration), Fairy Lumi (Enchanted Forest - magical knowledge), and Sergeant Nexus (Cyber Heist - tech specialist). They respond differently based on their character and your choices. The difficulty of the mission also impacts the harshness of the companion's responses!",
  },
];

export function QAMenu() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="h-[55vh] md:h-[65vh] flex flex-col">
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm pb-4">
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {filteredFaqs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm md:text-base">
              No FAQs found matching your search.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline text-left py-4">
                    <span className="font-medium text-sm md:text-base break-words">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base break-words">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
