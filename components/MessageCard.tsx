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
  threadTitle?: string;
  globalFilter?: 'unreplied' | 'replied' | 'all';
  onMessageMarked?: (id: string, next: boolean) => void;
};

export default function MessageCard({
  message,
  onMessageDelete,
  threadTitle,
  onMessageMarked,
}: MessageCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);

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
      const params = new URLSearchParams();
      params.set("reply", message.content);
      if (threadTitle) params.set("thread", threadTitle);
      const res = await fetch(`/api/reply-image-generation?${params.toString()}`);
      if (!res.ok) throw new Error(`failed to generate image (${res.status})`);
      const blob = await res.blob();

      const srcDataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("failed to read image data"));
        reader.readAsDataURL(blob);
      });

      const img = new Image();
      img.src = srcDataUrl;

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
      
      const canShareFiles =
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        (navigator as any).canShare?.({ files: [file] });

      if (!canShareFiles) {
        throw new Error("sharing files is not supported on this device");
      }

      await navigator.share({
        title: "Share TBH Answer",
        text: message.content,
        files: [file],
      });
      // auto-mark as replied on successful share
      try {
        setIsToggling(true);
        await axios.post(`/api/messages/${message._id}/mark-replied`);
        onMessageMarked?.(message._id as string, true);
      } catch {
        // ignore
      } finally {
        setIsToggling(false);
      }
    } catch (err) {
      toast.error("Unable to share", {
        description:
          err instanceof Error ? err.message : "something went wrong",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const toggleReplied = async () => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      const next = !(message as any).isReplied;
      const url = next
        ? `/api/messages/${message._id}/mark-replied`
        : `/api/messages/${message._id}/mark-unreplied`;
      await axios.post(url);
      onMessageMarked?.(message._id as string, next);
      toast.success(next ? 'Marked replied' : 'Marked unreplied');
    } catch {
      toast.error('Failed to update');
    } finally {
      setIsToggling(false);
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
              size="icon"
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

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleReplied}
              disabled={isToggling}
              className="flex-1 text-sm"
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {(message as any).isReplied ? 'Unreplied' : 'Replied'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
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