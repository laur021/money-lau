"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  !(globalThis as typeof globalThis & { __moneylauThemeWarningFiltered?: boolean })
    .__moneylauThemeWarningFiltered
) {
  const originalConsoleError = console.error;
  console.error = (...args: Parameters<typeof console.error>) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
    originalConsoleError(...args);
  };
  (globalThis as typeof globalThis & { __moneylauThemeWarningFiltered?: boolean })
    .__moneylauThemeWarningFiltered = true;
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
