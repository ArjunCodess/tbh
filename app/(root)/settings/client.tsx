"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ColorField from "@/components/ColorField";

export default function SettingsClient() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profileColor, setProfileColor] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string | null>(null);
  const [acceptMessages, setAcceptMessages] = useState<boolean | null>(null);
  const [isTogglingAccept, setIsTogglingAccept] = useState(false);
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
        setProfileColor(
          typeof u.profileColor === "string" ? u.profileColor : null
        );
        setTextColor(typeof u.textColor === "string" ? u.textColor : null);
      })
      .catch((error) => {
        console.error("Failed to fetch user data:", error);
        if (
          error.message?.includes("auth") ||
          error.message?.includes("unauthorized")
        ) {
          toast.error("Please log in to access your settings");
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/accept-messages", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.isAcceptingMessages === "boolean") {
          setAcceptMessages(!!data.isAcceptingMessages);
        }
      })
      .catch(() => {
        // leave as null on error
      });
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
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
                  <div>
                    <div className="mb-1 text-sm font-medium">
                      Accept anonymous messages
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Turn off to stop receiving new messages via your link.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTogglingAccept && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Switch
                      checked={!!acceptMessages}
                      onCheckedChange={async (checked) => {
                        setIsTogglingAccept(true);
                        try {
                          const res = await fetch("/api/accept-messages", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ acceptMessages: checked }),
                          });
                          const j = await res.json();
                          if (!res.ok || !j?.success)
                            throw new Error(j?.message || "Failed to update");
                          setAcceptMessages(checked);
                          toast.success(j?.message || "Updated");
                        } catch (e: any) {
                          toast.error(
                            e?.message || "Failed to update settings"
                          );
                        } finally {
                          setIsTogglingAccept(false);
                        }
                      }}
                      disabled={isTogglingAccept || acceptMessages === null}
                      aria-label="toggle accepting anonymous messages"
                    />
                  </div>
                </div>
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