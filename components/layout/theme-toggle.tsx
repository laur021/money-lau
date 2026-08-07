"use client";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // The resolved theme is only known in the browser. Rendering it during SSR
  // makes the initial server and client markup disagree.
  if (!mounted) {
    return null;
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Button
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={() => setTheme(nextTheme)}
      size="icon"
      variant="ghost"
    >
      {resolvedTheme === "dark" ? <Sun data-icon="inline-start" /> : <Moon data-icon="inline-start" />}
    </Button>
  );
}

export function ThemeToggleMenuButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <SidebarMenuButton disabled tooltip="Theme">
        <Moon aria-hidden="true" />
        <span>Theme</span>
      </SidebarMenuButton>
    );
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <SidebarMenuButton
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={() => setTheme(nextTheme)}
      tooltip={`Switch to ${nextTheme} theme`}
      type="button"
    >
      {resolvedTheme === "dark" ? <Sun aria-hidden="true" data-icon="inline-start" /> : <Moon aria-hidden="true" data-icon="inline-start" />}
      <span>{resolvedTheme === "dark" ? "Light theme" : "Dark theme"}</span>
    </SidebarMenuButton>
  );
}
