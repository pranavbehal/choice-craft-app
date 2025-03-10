"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "How do I start a mission?",
    answer:
      "From the home page, click on any mission card to begin. You'll need to be signed in first. Each mission has a unique companion and storyline.",
  },
  {
    question: "Can I change my avatar?",
    answer:
      "Yes! Go to Settings and you'll see avatar options. Click on any avatar to select it. Your choice is saved automatically and will be displayed in all missions.",
  },
  {
    question: "How does voice narration work?",
    answer:
      "Enable voice narration in Settings to hear your companions speak (made possible with the help of ElevenLabs AI voices). Make sure your device's volume is turned on. Each companion has a unique voice that matches their character.",
  },
  {
    question: "How do I end a mission?",
    answer:
      "Simply type 'stop' in the chat box at any time. You'll be redirected to the home page after a brief countdown.",
  },
  {
    question: "Where can I see my progress?",
    answer:
      "Visit the Results page to see detailed statistics about your missions, including completion rates, decision patterns, and achievements. You can also export this data and customize it.",
  },
];

export function QAMenu() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="w-full space-y-4">
      <Input
        type="search"
        placeholder="Search FAQs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredFaqs.map((faq, index) => (
        <Collapsible
          key={index}
          open={openItems.includes(index)}
          onOpenChange={() => toggleItem(index)}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted p-4 font-medium hover:bg-muted/80">
            {faq.question}
            {openItems.includes(index) ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-2">
            {faq.answer}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
