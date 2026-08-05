"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaChevronRight, FaRobot } from "react-icons/fa";
import { IoChatbubbleEllipses, IoClose, IoSend } from "react-icons/io5";

import { ApiError, streamChat } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AiProduct } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: AiProduct[];
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your IntelliShop AI assistant. Tell me what you're looking for and I'll find the best products for you!",
};

const TOOL_STATUS: Record<string, string> = {
  search_products: "Searching products...",
  get_cart: "Checking your cart...",
  update_cart: "Updating your cart...",
};

export default function AiChat() {
  const { user, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, streamingText, toolStatus]);

  if (!isLoggedIn || user?.role === "seller") {
    return null;
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");
    setToolStatus(null);

    let accumulatedText = "";

    try {
      const res = await streamChat(nextMessages.map((m) => ({ role: m.role, content: m.content })));
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          if (!frame.startsWith("data: ")) continue;
          const evt = JSON.parse(frame.slice(6));

          if (evt.event === "tool_call") {
            setToolStatus(TOOL_STATUS[evt.tool] ?? "Working on it...");
          } else if (evt.event === "tool_result") {
            setToolStatus(null);
          } else if (evt.event === "token") {
            accumulatedText += evt.text;
            setStreamingText(accumulatedText);
          } else if (evt.event === "done") {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: accumulatedText, products: evt.products },
            ]);
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof ApiError
              ? err.message
              : "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingText("");
      setToolStatus(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderProductCards = (products?: AiProduct[]) => {
    if (!products || products.length === 0) return null;
    return (
      <div className="space-y-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
              {product.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_path}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {product.name}
              </p>
              <p className="text-sm text-zinc-500">${product.effective_price.toFixed(2)}</p>
            </div>
            <FaChevronRight className="flex-shrink-0 text-xs text-zinc-400" />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="AI Shopping Assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isOpen ? <IoClose className="text-2xl" /> : <IoChatbubbleEllipses className="text-2xl" />}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:w-96 dark:border-zinc-800 dark:bg-zinc-950"
          style={{ height: "520px" }}
        >
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 dark:bg-black/10">
              <FaRobot className="text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Shopping Assistant</p>
              <p className="text-xs text-white/70 dark:text-zinc-900/60">Powered by Claude</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "rounded-bl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {renderProductCards(msg.products)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  {streamingText ? (
                    <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                      {streamingText}
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
                      {toolStatus ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{toolStatus}</p>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-900">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <IoSend className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
