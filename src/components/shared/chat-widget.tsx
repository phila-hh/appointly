/**
 * @file Chat Widget Component
 * @description Floating chatbot widget for business detail pages.
 *
 * Features:
 *   - Floating action button (bottom-right corner)
 *   - Expandable chat panel with smooth animation
 *   - Welcome message with quick-start suggestions
 *   - Message input with send button
 *   - Conversation history (client-side, per session)
 *   - Loading indicator while waiting for AI response
 *   - Rate limit display
 *   - Sign-in prompt for unauthenticated users
 *   - Action buttons parsed from LLM responses
 *   - Auto-scroll to latest message
 *   - Close button to collapse panel
 *
 * Architecture:
 *   - Fully client-side component
 *   - Calls the sendChatMessage server action for each message
 *   - Conversation history managed in React state (not persisted)
 *   - Business context passed as serialized props from the server
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  sendChatMessage,
  type ClientChatMessage,
  type BusinessChatContext,
} from "@/lib/actions/chat";
import { ChatMessage } from "@/components/shared/chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/** Props accepted by the ChatWidget component. */
interface ChatWidgetProps {
  /** Serialized business context from the server. */
  businessContext: BusinessChatContext;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
}

/**
 * Quick-start suggestion prompts shown on first open.
 * These help users get started with the chatbot.
 */
const QUICK_SUGGESTIONS = [
  "What are your hours?",
  "What services do you offer?",
  "How much does a basic service cost?",
  "Where are you located?",
  "Do you have any availability this week?",
];

export function ChatWidget({
  businessContext,
  isAuthenticated,
}: ChatWidgetProps) {
  // Panel visibility state
  const [isOpen, setIsOpen] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState<ClientChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [remaining, setRemaining] = useState<number | undefined>(undefined);

  // Ref for auto-scrolling to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** Auto-scroll when new messages arrive. */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  /**
   * Send a message to the chatbot.
   */
  async function handleSend(message?: string) {
    const text = message ?? inputValue.trim();
    if (!text || isSending) return;

    // Add user message to conversation
    const userMessage: ClientChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsSending(true);

    try {
      const result = await sendChatMessage(
        businessContext,
        text,
        messages // Send previous history (not including current message)
      );

      if (result.success && result.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.message! },
        ]);
        if (result.remaining !== undefined) {
          setRemaining(result.remaining);
        }
      } else {
        // Show error as assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              result.error ??
              "Sorry, I'm having trouble right now. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  /**
   * Handle form submission.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  /**
   * Handle keyboard enter press.
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{businessContext.name}</p>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              AI
            </Badge>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="h-[350px]">
          <div className="space-y-4 p-4">
            {!isAuthenticated ? (
              /* Sign-in prompt */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">
                  Chat with our AI assistant
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Sign in to ask questions about this business.
                </p>
                <Button size="sm" asChild>
                  <Link href="/sign-in">
                    Sign In
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : messages.length === 0 ? (
              /* Welcome state with suggestions */
              <div className="space-y-4">
                {/* Welcome message */}
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-2.5 text-sm">
                    Hi! 👋 I&apos;m the AI assistant for{" "}
                    <strong>{businessContext.name}</strong>. I can answer
                    questions about services, hours, pricing, and more. How can
                    I help you?
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="space-y-2 pl-9">
                  <p className="text-xs text-muted-foreground">
                    Quick questions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSend(suggestion)}
                        disabled={isSending}
                        className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Conversation messages */
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} content={msg.content} />
                ))}
              </>
            )}

            {/* Loading indicator */}
            {isSending && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area — only shown when authenticated */}
        {isAuthenticated && (
          <div className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={isSending}
                className="text-sm"
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || !inputValue.trim()}
                className="shrink-0"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            {remaining !== undefined && (
              <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
                {remaining} message{remaining !== 1 ? "s" : ""} remaining this
                hour
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
