"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  return <Button aria-label={`Switch to ${nextTheme} theme`} onClick={() => setTheme(nextTheme)} size="icon" variant="ghost">{resolvedTheme === "dark" ? <Sun /> : <Moon />}</Button>;
}
