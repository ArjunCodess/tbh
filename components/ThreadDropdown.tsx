"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";

type Thread = {
  title: string;
  slug: string;
};

type ThreadDropdownProps = {
  threads: Thread[];
  defaultSlug?: string;
  className?: string;
};

export default function ThreadDropdown({
  threads,
  defaultSlug = "ama",
  className,
}: ThreadDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSlug = searchParams.get("q") || defaultSlug;

  React.useEffect(() => {
    if (!searchParams.get("q")) {
      const url = new URL(window.location.href);
      url.searchParams.set("q", defaultSlug);
      router.replace(`${url.pathname}?${url.searchParams.toString()}`);
    }
  }, [defaultSlug, router, searchParams]);

  const orderedThreads = React.useMemo(() => {
    const [defaultThread, others] = threads.reduce<
      [Thread | undefined, Thread[]]
    >(
      (acc, t) => {
        if (t.slug === defaultSlug) acc[0] = t;
        else acc[1].push(t);
        return acc;
      },
      [undefined, []]
    );
    return [...(defaultThread ? [defaultThread] : []), ...others];
  }, [threads, defaultSlug]);

  function handleChange(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("q", next);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <SelectGroup className={className}>
      <label htmlFor="anonymous-message" className="text-sm font-medium">
        {"Choose a thread"}
      </label>
      <Select value={currentSlug} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select thread" />
        </SelectTrigger>
        <SelectContent>
          {orderedThreads.map((t) => (
            <SelectItem key={t.slug} value={t.slug}>
              {t.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SelectGroup>
  );
}