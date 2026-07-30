"use client";

import { Button } from "@/components/ui/button";
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
      {resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
