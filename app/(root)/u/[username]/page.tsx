import MessageForm from "@/components/MessageForm";
import ThreadDropdown from "@/components/ThreadDropdown";
import type { Metadata } from "next";
import { Suspense } from "react";
import connectToDatabase from "@/lib/connectToDatabase";
import { findUserByUsernameCI } from "@/lib/userIdentity";
import ThreadModel from "@/lib/models/thread.schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Send an anonymous message to @${username}`,
    description: `Write and send an anonymous message to @${username}. Your message will be delivered privately.`,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams?: Promise<{ q?: string }>
}) {
  const { username } = await params;
  const { q } = (searchParams ? await searchParams : {}) as { q?: string };
  await connectToDatabase();
  const user = await findUserByUsernameCI(username);
  let threads: { title: string; slug: string }[] = [];
  if (user?._id) {
    const items = await ThreadModel.find(
      { userId: user._id },
      { title: 1, slug: 1 },
      { lean: true }
    )
      .sort({ createdAt: -1 })
      .exec();

    const plain = (items || []).map((t: any) => ({
      title: String(t?.title ?? ""),
      slug: String(t?.slug ?? ""),
    }));
    const ama = plain.find((t) => t.slug === "ama");
    const rest = plain.filter((t) => t.slug !== "ama");
    threads = ama ? [ama, ...rest] : rest;
  } else {
    threads = [{ title: "ask me anything", slug: "ama" }];
  }
  const selectedThreadSlug =
    (q && threads.some(t => t.slug === q) ? q : undefined) ??
    threads.find(t => t.slug === 'ama')?.slug ??
    threads[0]?.slug ??
    'ama';

  return (
    <main className="min-h-[calc(100dvh-0px)] w-full px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <section className="rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="p-6 md:p-8">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Send an anonymous message</h1>
            <p className="mt-1 text-sm text-muted-foreground">to @{username}</p>

            <div className="mt-6 flex flex-col gap-4">
              <Suspense fallback={<div className="mb-4 h-9 w-full rounded-md bg-muted animate-pulse" aria-hidden="true" />}> 
                <ThreadDropdown threads={threads} />
              </Suspense>
              <MessageForm username={username} threadSlug={selectedThreadSlug} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}