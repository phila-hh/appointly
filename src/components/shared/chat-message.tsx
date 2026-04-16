/**
 * @file Chat Message Component
 * @description Renders a single chat message bubble with support for
 * action markers that get converted into clickable buttons.
 *
 * Action markers:
 *   - [BOOK:slug] → "Book Now" button linking to /business/[slug]/book
 *   - [SERVICES:slug] → "View Services" button linking to /business/[slug]
 *
 * These markers are embedded by the LLM in its response and parsed
 * by this component into interactive elements.
 */

import Link from "next/link";
import { CalendarPlus, Scissors, Bot, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Props accepted by the ChatMessage component. */
interface ChatMessageProps {
  /** The message role (user or assistant). */
  role: "user" | "assistant";
  /** The raw message content (may contain action markers). */
  content: string;
}

/**
 * Regex patterns for action markers in the LLM response.
 * These markers are replaced with interactive buttons.
 */
const ACTION_PATTERNS = {
  book: /\[BOOK:([^\]]+)\]/g,
  services: /\[SERVICES:([^\]]+)\]/g,
};

/**
 * Parses a message string and extracts action markers.
 * Returns the clean text (without markers) and an array of actions.
 */
function parseActions(content: string): {
  text: string;
  actions: Array<{
    type: "book" | "services";
    slug: string;
  }>;
} {
  const actions: Array<{ type: "book" | "services"; slug: string }> = [];

  // Extract [BOOK:slug] markers
  let match;
  while ((match = ACTION_PATTERNS.book.exec(content)) !== null) {
    actions.push({ type: "book", slug: match[1] });
  }

  // Reset regex lastIndex
  ACTION_PATTERNS.book.lastIndex = 0;

  // Extract [SERVICES:slug] markers
  while ((match = ACTION_PATTERNS.services.exec(content)) !== null) {
    actions.push({ type: "services", slug: match[1] });
  }

  // Reset regex lastIndex
  ACTION_PATTERNS.services.lastIndex = 0;

  // Remove markers from the displayed text
  const cleanText = content
    .replace(ACTION_PATTERNS.book, "")
    .replace(ACTION_PATTERNS.services, "")
    .trim();

  // Reset regex lastIndex again after replace
  ACTION_PATTERNS.book.lastIndex = 0;
  ACTION_PATTERNS.services.lastIndex = 0;

  return { text: cleanText, actions };
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  const { text, actions } = isUser
    ? { text: content, actions: [] }
    : parseActions(content);

  return (
    <div
      className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Message bubble */}
      <div className={cn("max-w-[80%] space-y-2", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground"
              : "rounded-tl-md bg-muted text-foreground"
          )}
        >
          {/* Message text with basic line break support */}
          {text.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < text.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Action buttons — only for assistant messages */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => {
              if (action.type === "book") {
                return (
                  <Button
                    key={`${action.type}-${i}`}
                    size="sm"
                    asChild
                    className="h-8"
                  >
                    <Link href={`/business/${action.slug}/book`}>
                      <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                      Book Now
                    </Link>
                  </Button>
                );
              }

              return (
                <Button
                  key={`${action.type}-${i}`}
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8"
                >
                  <Link href={`/business/${action.slug}`}>
                    <Scissors className="mr-1.5 h-3.5 w-3.5" />
                    View Services
                  </Link>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
