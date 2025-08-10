"use client";

import React from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Trash2, Loader2, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import type { Message } from "@/lib/models/message.schema";
import type { apiResponse } from "@/types/apiResponse";
import { toPng } from "html-to-image";

dayjs.extend(relativeTime);

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
};

export default function MessageCard({
  message,
  onMessageDelete,
}: MessageCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const response = await axios.delete<apiResponse>(
        `/api/delete-message/${message._id}`
      );
      toast.success(response.data.message);
      onMessageDelete(message._id as string);
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareStory = async () => {
    try {
      setIsSharing(true);
      const res = await fetch(
        `/api/question-image-generation?question=${encodeURIComponent(
          message.content
        )}`
      );
      if (!res.ok) throw new Error(`failed to generate image (${res.status})`);
      const blob = await res.blob();

      const img = new Image();
      img.crossOrigin = "anonymous";
      const objectUrl = URL.createObjectURL(blob);
      img.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        const onLoad = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("failed to load generated image"));
        };
        const cleanup = () => {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
        };
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onError);
      });

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-10000px";
      wrapper.style.top = "0";
      wrapper.appendChild(img);
      document.body.appendChild(wrapper);

      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const dataUrl = await toPng(img, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const outBlob = await (await fetch(dataUrl)).blob();
      const file = new File([outBlob], "tbh-answer.png", { type: "image/png" });

      document.body.removeChild(wrapper);
      URL.revokeObjectURL(objectUrl);

      await navigator.share({
        title: "Share TBH Answer",
        text: message.content,
        files: [file],
      });
    } catch (err) {
      toast.error("Unable to share", {
        description:
          err instanceof Error ? err.message : "something went wrong",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="flex flex-col h-full">
        {/* Message */}
        <p className="text-balance font-medium text-lg leading-relaxed line-clamp-4 break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Bottom bar */}
        <div className="mt-auto pt-2">
          {/* Time */}
          <p className="text-sm text-muted-foreground font-medium">
            {dayjs(message.createdAt).fromNow()}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareStory}
              disabled={isSharing}
              className="flex-1 text-sm"
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {isSharing ? "Sharing…" : "Share to Story"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this message.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-700"
                    onClick={handleDeleteConfirm}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}