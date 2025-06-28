import React from "react";

export function useChatJson({
  api = "/api/chat",
  initialMessages = [],
  body = {},
  onFinish,
}: {
  api?: string;
  initialMessages?: {
    id?: string;
    role: "user" | "assistant";
    content: string;
  }[];
  body?: Record<string, unknown>;
  onFinish?: () => void;
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [input, setInput] = React.useState("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const append = async (message: {
    content: string;
    role: "user" | "assistant";
    id?: string;
  }) => {
    const { content, role } = message;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const userMessage = { id, role, content };
    setMessages((prev) => [...prev, userMessage]);

    if (role === "user") {
      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            messages: [...messages, userMessage],
          }),
        });
        const data = await res.json();
        const assistantMsg = {
          id: crypto.randomUUID
            ? crypto.randomUUID()
            : (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: data.content,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (onFinish) onFinish();
      } catch (err) {
        console.error("Error calling chat API:", err);
      }
    }
  };

  return {
    messages,
    input,
    handleInputChange,
    append,
    setMessages,
  };
}
