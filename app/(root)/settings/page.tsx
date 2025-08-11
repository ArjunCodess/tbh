"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { toast } from "sonner";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (hex: string) => void;
}) {
  if (!value) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-2 text-sm font-medium">{label}</div>
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <ColorPicker
        className="flex w-full flex-col gap-3"
        value={value}
        onChange={(rgba) => {
          const [r, g, b] = rgba as any;
          const hex = `#${[r, g, b]
            .map((n: number) =>
              Math.max(0, Math.min(255, Math.round(n)))
                .toString(16)
                .padStart(2, "0")
            )
            .join("")}`;
          onChange(hex.toUpperCase());
        }}
      >
        <ColorPickerSelection className="h-24 rounded-md" />
        <div className="flex items-center gap-4">
          <ColorPickerEyeDropper />
          <div className="grid w-full gap-1">
            <ColorPickerHue />
            <ColorPickerOutput />
          </div>
        </div>
      </ColorPicker>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profileColor, setProfileColor] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<
    "Idle" | "Checking" | "Available" | "Taken" | "Invalid" | "Unchanged"
  >("Idle");
  const [originalUsername, setOriginalUsername] = useState("");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const u = data?.user || {};
        setDisplayName(
          typeof u.displayName === "string"
            ? u.displayName
            : typeof u.username === "string"
            ? u.username
            : ""
        );
        setUsername(typeof u.username === "string" ? u.username : "");
        setOriginalUsername(
          typeof u.username === "string" ? u.username.toLowerCase() : ""
        );
        setProfileColor(typeof u.profileColor === "string" ? u.profileColor : null);
        setTextColor(typeof u.textColor === "string" ? u.textColor : null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const v = username.trim().toLowerCase();
    if (!v) {
      setUsernameCheck("Invalid");
      return;
    }
    if (!/^[a-z0-9_]{1,20}$/.test(v)) {
      setUsernameCheck("Invalid");
      return;
    }
    if (v === originalUsername) {
      setUsernameCheck("Unchanged");
      return;
    }
    let stopped = false;
    setUsernameCheck("Checking");
    const id = setTimeout(() => {
      fetch(`/api/check-username-unique?username=${encodeURIComponent(v)}`)
        .then((r) => r.json())
        .then((j) => {
          if (!stopped) setUsernameCheck(j?.success ? "Available" : "Taken");
        })
        .catch(() => {
          if (!stopped) setUsernameCheck("Invalid");
        });
    }, 300);
    return () => {
      stopped = true;
      clearTimeout(id);
    };
  }, [username, originalUsername]);

  const onSave = useCallback(async () => {
    const payload: any = {
      displayName,
      username: username.trim().toLowerCase(),
      ...(profileColor ? { profileColor } : {}),
      ...(textColor ? { textColor } : {}),
    };
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok || !j?.success) {
      toast.error(j?.message || "Failed to save");
      return;
    }
    toast.success("Profile saved");
    if (payload.username && payload.username !== originalUsername) {
      setOriginalUsername(payload.username);
    }
  }, [displayName, username, profileColor, textColor, originalUsername]);

  return (
    <main className="min-h-[calc(100vh-60px)] w-full px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <section className="rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="space-y-8 p-6 md:p-10">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Profile Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize your public profile.
              </p>
            </div>
            <div className="grid gap-8">
              <div className="grid gap-3">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName ?? ""}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="your name"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="username">Username</Label>
                  <span
                    className={cn(
                      "text-xs",
                      usernameCheck === "Available" ||
                        usernameCheck === "Unchanged"
                        ? "text-green-600"
                        : usernameCheck === "Taken"
                        ? "text-red-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {usernameCheck}
                  </span>
                </div>
                <Input
                  id="username"
                  value={username ?? ""}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="flex-1"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <ColorField
                  label="Profile Color"
                  value={profileColor}
                  onChange={setProfileColor}
                />
                <ColorField
                  label="Text Color"
                  value={textColor}
                  onChange={setTextColor}
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                className="w-full"
                onClick={onSave}
                disabled={
                  usernameCheck === "Taken" || usernameCheck === "Invalid"
                }
              >
                Save Changes
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}