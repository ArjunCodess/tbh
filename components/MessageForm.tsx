"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

type MessageFormProps = {
  username?: string;
};

const HARD_CODED_SUGGESTIONS = [
  "What small win made your day this week?",
  "Which city would you love to explore next?",
  "What's a film you never get tired of?",
] as const;

export default function MessageForm({
  username = "someone",
}: MessageFormProps) {
  const [content, setContent] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([
    ...HARD_CODED_SUGGESTIONS,
  ]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const hasContent = content.trim().length > 0;

  function handleUseSuggestion(s: string) {
    setContent(s);
    textareaRef.current?.focus();
  }

  async function handleSuggest() {
    try {
      setIsSuggesting(true);
      const res = await fetch("/api/suggest-messages", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data: { questions?: string } = await res.json();
      const raw = typeof data?.questions === "string" ? data.questions : "";
      const items = raw
        .split("||")
        .map((t) => t.trim())
        .filter(Boolean);

      if (items.length !== 3) {
        throw new Error("invalid suggestions format");
      }
      setSuggestions(items);
    } catch (err: unknown) {
      const description =
        err instanceof Error ? err.message : "Unable to fetch suggestions";
      toast.error("Could not load suggestions", {
        description,
      });
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasContent || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          username,
        }),
      });

      if (!res.ok) {
        let message = `Failed with status ${res.status}`;
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      let successMessage = "Message sent!";
      try {
        const data = await res.json();
        if (data?.message) successMessage = data.message;
      } catch {
        // if no JSON, keep default
      }

      toast.success("Success", {
        description: successMessage,
      });
      setContent("");
      textareaRef.current?.focus();
    } catch (err: unknown) {
      const description =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error("Could not send message", {
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="anonymous-message" className="text-sm font-medium">
            {"Write your anonymous message here"}
          </label>
          <Textarea
            id="anonymous-message"
            ref={textareaRef}
            placeholder="Write your anonymous message here"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            aria-required="true"
            rows={5}
            className="resize-y"
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Button
            type="submit"
            disabled={!hasContent || isSubmitting}
            aria-disabled={!hasContent || isSubmitting}
            aria-busy={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                {"Sending..."}
              </>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </form>

      <Separator className="my-6" />

      <div aria-label="Message suggestions">
        <ul className="flex flex-col gap-2 w-full" role="list">
          {suggestions.map((s, idx) => (
            <li key={`${s}-${idx}`} role="listitem">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleUseSuggestion(s)}
                aria-label={`Use suggestion: ${s}`}
                className="w-full"
              >
                <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                {s}
              </Button>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <Button
            type="button"
            className="w-full"
            onClick={handleSuggest}
            disabled={isSuggesting}
            aria-busy={isSuggesting}
          >
            {isSuggesting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                {"Loading suggestions..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                {"Suggest Messages"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}