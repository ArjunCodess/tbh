"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MessageCard from "@/components/MessageCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ImagePlus,
  Trash2,
  Plus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { Message } from "@/lib/models/message.schema";
import type { apiResponse } from "@/types/apiResponse";
import { toPng } from "html-to-image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

type ThreadLite = { _id?: string; title: string; slug: string };

type DashboardClientProps = {
  username: string;
  dailyPrompt: string;
  initialThreads: ThreadLite[];
  initialMessagesByThread: Record<string, Message[]>;
};

export default function DashboardClient({
  username,
  dailyPrompt,
  initialThreads,
  initialMessagesByThread,
}: DashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const [threads, setThreads] = useState<ThreadLite[]>(initialThreads);
  const [messagesByThread, setMessagesByThread] = useState<
    Record<string, Message[]>
  >(initialMessagesByThread);
  const [isThreadsLoading, setIsThreadsLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState<Record<string, boolean>>(
    {}
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSharingToStory, setIsSharingToStory] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isDeletingSlug, setIsDeletingSlug] = useState<string | null>(null);

  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [isCreatingFromPrompt, setIsCreatingFromPrompt] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const t of initialThreads) initial[t.slug] = t.slug === "ama";
    return initial;
  });
  const initialSelected =
    initialThreads.find((t) => t.slug === "ama")?.slug ||
    initialThreads[0]?.slug ||
    "ama";
  const [selectedThreadSlug, setSelectedThreadSlug] =
    useState<string>(initialSelected);

  const [profileUrl, setProfileUrl] = useState("");
  const [filter, setFilter] = useState<"unreplied" | "replied" | "all">(
    "unreplied"
  );

  const fetchThreadsAndMessages = useCallback(
    async (showRefreshToast = false) => {
      if (showRefreshToast) setIsRefreshing(true);
      setIsThreadsLoading(true);
      try {
        const tRes = await axios.get<{
          success: boolean;
          threads: (ThreadLite & { count?: number })[];
        }>("/api/threads", { params: { filter } });
        const fetchedThreads = tRes.data?.threads || [];
        const ordered = [
          ...fetchedThreads.filter((t) => t.slug === "ama"),
          ...fetchedThreads.filter((t) => t.slug !== "ama"),
        ];
        setThreads(ordered);

        const loaders: Record<string, boolean> = {};
        for (const t of ordered) loaders[t.slug] = true;
        setLoadingThreads(loaders);

        const results = await Promise.all(
          ordered.map((t) =>
            axios
              .get<apiResponse>(`/api/get-messages`, {
                params: { threadSlug: t.slug, filter },
              })
              .then((r) => ({
                slug: t.slug,
                messages: (r.data.messages || []) as Message[],
              }))
              .catch((error) => {
                console.error(
                  `Failed to fetch messages for thread ${t.slug}:`,
                  error
                );
                return { slug: t.slug, messages: [] as Message[] };
              })
          )
        );

        const map: Record<string, Message[]> = {};
        results.forEach(({ slug, messages }) => {
          const sorted = [...messages].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          map[slug] = sorted;
        });
        setMessagesByThread(map);
        if (showRefreshToast) toast.success("Messages refreshed");
      } catch {
        toast.error("Failed to fetch threads or messages");
      } finally {
        setIsThreadsLoading(false);
        setIsRefreshing(false);
        setLoadingThreads({});
      }
    },
    [filter]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${
        window.location.origin
      }/u/${username}?q=${encodeURIComponent(selectedThreadSlug)}`;
      setProfileUrl(url);
    }
  }, [username, selectedThreadSlug]);

  useEffect(() => {
    const url =
      typeof window !== "undefined" ? new URL(window.location.href) : null;
    if (!url) return;
    const f = (url.searchParams.get("f") || "unreplied").toLowerCase();
    const next =
      f === "replied" ? "replied" : f === "all" ? "all" : "unreplied";
    if (next !== filter) setFilter(next);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("f", filter);
      window.history.replaceState(
        null,
        "",
        `${url.pathname}?${url.searchParams.toString()}`
      );
    }
  }, [filter]);

  useEffect(() => {
    fetchThreadsAndMessages(false);
  }, [fetchThreadsAndMessages]);

  const shareToStory = async () => {
    if (isSharingToStory) return;

    if (!navigator.share || !navigator.canShare) {
      toast.error("Sharing is not supported on this device or browser");
      return;
    }

    setIsSharingToStory(true);
    let wrapper: HTMLDivElement | null = null;
    try {
      const imagePaths = ["/qna1.png", "/qna2.png", "/qna3.png", "/qna4.png"];
      const selectedPath =
        imagePaths[Math.floor(Math.random() * imagePaths.length)];

      const img = new window.Image();
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

      const dataUrl = await toPng(img, { cacheBust: true, pixelRatio: 2 });
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
  const handleCreateThread = async () => {
    const title = newThreadTitle.trim();
    if (!title || isCreatingThread) return;
    try {
      setIsCreatingThread(true);
      const res = await axios.post("/api/threads", { title });
      setNewThreadTitle("");
      const created = (res.data?.thread || null) as ThreadLite | null;
      if (created && created.slug) {
        // optimistic add with count 0
        setThreads((prev) => {
          const exists = prev.some((t) => t.slug === created.slug);
          const ama = prev.find((t) => t.slug === "ama");
          const others = prev.filter(
            (t) => t.slug !== "ama" && t.slug !== created.slug
          );
          const ordered = [...(ama ? [ama] : []), ...others, created];
          return exists ? prev : ordered;
        });
        setMessagesByThread((prev) => ({
          ...prev,
          [created.slug]: prev[created.slug] || [],
        }));
        setSelectedThreadSlug(created.slug);
      }

      await fetchThreadsAndMessages(true);
    } catch (e: any) {
      toast.error("Failed to create thread", {
        description: e?.response?.data?.message || e?.message,
      });
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleCreateThreadFromPrompt = async () => {
    const title = (dailyPrompt || "").trim();
    if (!title || isCreatingFromPrompt) return;
    try {
      setIsCreatingFromPrompt(true);
      const res = await axios.post("/api/threads", { title });
      const created = (res.data?.thread || null) as ThreadLite | null;
      if (created && created.slug) {
        setThreads((prev) => {
          const exists = prev.some((t) => t.slug === created.slug);
          const ama = prev.find((t) => t.slug === "ama");
          const others = prev.filter(
            (t) => t.slug !== "ama" && t.slug !== created.slug
          );
          const ordered = [...(ama ? [ama] : []), ...others, created];
          return exists ? prev : ordered;
        });
        setMessagesByThread((prev) => ({
          ...prev,
          [created.slug]: prev[created.slug] || [],
        }));
        setSelectedThreadSlug(created.slug);
        toast.success("Thread created from daily prompt");
      }
    } catch (e: any) {
      toast.error("Failed to create thread", {
        description: e?.response?.data?.message || e?.message,
      });
    } finally {
      setIsCreatingFromPrompt(false);
    }
  };

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

  const handleDeleteMessageFactory =
    (threadSlug: string) => (messageId: string) => {
      setMessagesByThread((prev) => ({
        ...prev,
        [threadSlug]: (prev[threadSlug] || []).filter(
          (m) => (m._id as any) !== messageId
        ),
      }));
    };

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 min-h-[calc(100vh-60px)] max-w-6xl">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-4">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
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
              onClick={() => fetchThreadsAndMessages(true)}
              disabled={isRefreshing || isThreadsLoading}
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <div className="w-full">
                <Select
                  value={selectedThreadSlug}
                  onValueChange={(v) => setSelectedThreadSlug(v)}
                >
                  <SelectTrigger className="w-full flex-1 px-4 py-3 min-h-12 text-base bg-muted rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring">
                    <SelectValue placeholder="Select thread" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {threads.map((t) => (
                        <SelectItem key={t.slug} value={t.slug}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="text-base h-12">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Thread
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create a new thread</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter a title. We will generate a unique slug per your
                      account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Thread title"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      className="w-full px-4 py-3 text-base bg-muted rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCreateThread}
                      disabled={isCreatingThread || !newThreadTitle.trim()}
                    >
                      {isCreatingThread ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        "Create"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardContent>
            <div className="flex flex-col md:flex-row text-center items-center justify-between gap-3">
              <Badge className="uppercase text-sm">Daily Prompt</Badge>
              <p className="text-base leading-relaxed">{dailyPrompt}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={!dailyPrompt || isCreatingFromPrompt}
                onClick={handleCreateThreadFromPrompt}
              >
                {isCreatingFromPrompt ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Thread"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages grouped by thread */}
      <div className="space-y-8">
        {isThreadsLoading && (
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
        )}

        {!isThreadsLoading && threads.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No threads yet</h3>
              <p className="text-base text-muted-foreground">
                Create a thread to start organizing your messages
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-2xl font-semibold">Threads</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("unreplied")}>
                  Unreplied
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("replied")}>
                  Replied
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {threads.map((t, i) => {
              const list = messagesByThread[t.slug] || [];
              const isLoading = !!loadingThreads[t.slug];
              const visibleMessages = list.filter((m) => {
                if (filter === "all") return true;
                return filter === "replied"
                  ? (m as any).isReplied
                  : !(m as any).isReplied;
              });
              return (
                <div key={t.slug} className="w-full space-y-3 border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-3 group w-full"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [t.slug]: !(prev[t.slug] ?? true),
                        }))
                      }
                      aria-expanded={expanded[t.slug] ?? true}
                    >
                      {expanded[t.slug] ?? true ? (
                        <Image
                          src="/folder-open.svg"
                          alt="folder open"
                          className="h-8 w-8"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <Image
                          src="/folder-closed.svg"
                          alt="folder closed"
                          className="h-8 w-8 opacity-90"
                          width={32}
                          height={32}
                        />
                      )}
                      <h2 className="text-base md:text-lg lg:text-xl font-medium text-left flex flex-row items-center text-balance">
                        {t.title}
                        <Badge className="size-6 min-w-0 min-h-0 m-2 p-2 flex items-center justify-center rounded-full text-sm">
                          {isLoading
                            ? ""
                            : `${(t as any).count ?? list.length}`}
                        </Badge>
                      </h2>
                    </button>
                    <div className="flex items-center gap-2">
                      {t.slug !== "ama" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              {isDeletingSlug === t.slug ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this thread?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the thread and its
                                grouping messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    setIsDeletingSlug(t.slug);
                                    await axios.delete("/api/threads", {
                                      data: { slug: t.slug },
                                    });

                                    const nextThreadsList = threads.filter(
                                      (x) => x.slug !== t.slug
                                    );
                                    setThreads(nextThreadsList);

                                    setMessagesByThread((prev) => {
                                      const copy = { ...prev } as any;
                                      delete copy[t.slug];
                                      return copy;
                                    });

                                    if (selectedThreadSlug === t.slug) {
                                      const fallbackSlug =
                                        nextThreadsList.find(
                                          (x) => x.slug === "ama"
                                        )?.slug ||
                                        nextThreadsList[0]?.slug ||
                                        "ama";
                                      setSelectedThreadSlug(fallbackSlug);
                                    }

                                    toast.success("Thread deleted");
                                  } catch (e: any) {
                                    toast.error("Failed to delete thread", {
                                      description:
                                        e?.response?.data?.message ||
                                        e?.message,
                                    });
                                  } finally {
                                    setIsDeletingSlug(null);
                                  }
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  {(expanded[t.slug] ?? true) &&
                    (isLoading ? (
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
                    ) : visibleMessages.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <h3 className="text-xl font-semibold mb-2">
                            No messages yet
                          </h3>
                          <p className="text-base text-muted-foreground">
                            Share your link to start receiving messages
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {visibleMessages.map((message) => (
                          <MessageCard
                            key={message._id as string}
                            message={message as any}
                            onMessageDelete={handleDeleteMessageFactory(t.slug)}
                            threadTitle={t.title}
                            globalFilter={filter}
                            onMessageMarked={(id, next) => {
                              setMessagesByThread((prev) => {
                                const copy = { ...prev };
                                copy[t.slug] = (copy[t.slug] || []).map((m) =>
                                  String(m._id) === id
                                    ? ({ ...m, isReplied: next } as any)
                                    : m
                                );
                                return copy;
                              });
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  {i < threads.length - 1 && (
                    <div className="py-2">
                      <Separator />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}