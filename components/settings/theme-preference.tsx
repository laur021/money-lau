"use client";

import { useTransition } from "react";
import { useTheme } from "next-themes";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { updateThemePreference } from "@/features/settings/actions";

export function ThemePreference({ defaultTheme }: { defaultTheme: "light" | "dark" | "system" }) {
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label="Theme preference"
      defaultValue={defaultTheme}
      disabled={isPending}
      id="theme-preference"
      name="theme"
      onChange={(event) => {
        const theme = event.target.value as "light" | "dark" | "system";
        setTheme(theme);
        const formData = new FormData();
        formData.set("theme", theme);
        startTransition(() => updateThemePreference(formData));
      }}
    >
      <NativeSelectOption value="dark">Dark</NativeSelectOption>
      <NativeSelectOption value="light">Light</NativeSelectOption>
      <NativeSelectOption value="system">System</NativeSelectOption>
    </NativeSelect>
  );
}
