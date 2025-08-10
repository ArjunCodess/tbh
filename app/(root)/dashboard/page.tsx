"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MessageCard from "@/components/MessageCard";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, RefreshCw, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { Message } from "@/lib/models/message.schema";
import type { apiResponse } from "@/types/apiResponse";
import { toPng } from "html-to-image";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [copied, setCopied] = useState(false);
  const [acceptMessages, setAcceptMessages] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSharingToStory, setIsSharingToStory] = useState(false);

  const username = (session as any)?.user?.username;
  const profileUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/profile/${username}`;

  const fetchAcceptMessages = async () => {
    try {
      const response = await axios.get<apiResponse>("/api/accept-messages");
      setAcceptMessages(!!response.data.isAcceptingMessages);
    } catch {
      toast.error("Failed to load settings", {
        description: "Could not fetch message acceptance status",
      });
    } finally {
      setIsSwitchLoading(false);
    }
  };

  const fetchMessages = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsMessagesLoading(true);
    }

    try {
      const response = await axios.get<apiResponse>("/api/get-messages");
      const fetchedMessages: Message[] = response.data.messages || [];
      const sortedMessages = [...fetchedMessages].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMessages(sortedMessages);
      if (showRefreshToast) {
        toast.success("Messages refreshed");
      }
    } catch {
      toast.error("Failed to fetch messages");
    } finally {
      setIsMessagesLoading(false);
      setIsRefreshing(false);
    }
  };

  const shareToStory = async () => {
    if (isSharingToStory) return;
    setIsSharingToStory(true);
    let wrapper: HTMLDivElement | null = null;
    try {
      const imagePaths = ["/qna1.png", "/qna2.png", "/qna3.png", "/qna4.png"];
      const selectedPath =
        imagePaths[Math.floor(Math.random() * imagePaths.length)];

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedPath;

      await new Promise<void>((resolve, reject) => {
        const onLoad = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("failed to load image"));
        };
        const cleanup = () => {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
        };
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onError);
      });

      wrapper = document.createElement("div");
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
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "question.png", { type: "image/png" });

      await navigator.share({
        title: "Share TBH Question",
        text: "Check out this question sent to me anonymously on TBH.",
        files: [file],
      });
    } catch (err: any) {
      toast.error("Unable to share", {
        description:
          err?.message ?? "Something went wrong while preparing the image.",
      });
    } finally {
      if (wrapper && document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
      setIsSharingToStory(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchAcceptMessages();
    fetchMessages();
  }, [status]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSwitchChange = async (checked: boolean) => {
    setIsToggling(true);
    try {
      const response = await axios.post<apiResponse>("/api/accept-messages", {
        acceptMessages: checked,
      });
      setAcceptMessages(checked);
      toast.success(response.data.message);
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
  };

  if (status === "loading") {
    return (
      <div className="text-center h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center h-screen flex items-center justify-center">
        You must sign in to view the dashboard.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 min-h-screen max-w-6xl">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-4">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-1">
              {(isSwitchLoading || isToggling) && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <Switch
                checked={acceptMessages}
                onCheckedChange={handleSwitchChange}
                disabled={isSwitchLoading || isToggling}
              />
            </div>
            <Button
              size="default"
              variant="outline"
              className="px-4"
              disabled={isSharingToStory}
              onClick={shareToStory}
            >
              {isSharingToStory ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ImagePlus className="h-4 w-4 mr-2" />
              )}
              {isSharingToStory ? "Preparing…" : "Share to Story"}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchMessages(true)}
              disabled={isRefreshing || isMessagesLoading}
              size="default"
              className="px-4"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm">Refresh</span>
            </Button>
          </div>
        </div>
        {/* Top Controls moved to header */}

        {/* Profile Link */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 px-4 py-3 text-base bg-muted rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                onClick={copyToClipboard}
                size="lg"
                className="text-base h-12"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-6" />

      {/* Messages Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Messages {!isMessagesLoading && `(${messages.length})`}
          </h2>
        </div>

        {/* Loading State */}
        {isMessagesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse" />
                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
                      <div className="h-9 w-12 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-base text-muted-foreground">
                Share your link to start receiving messages
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Messages Grid */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {messages.map((message) => (
              <MessageCard
                key={message._id as string}
                message={message as any}
                onMessageDelete={handleDeleteMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}