import { describe, expect, it } from "vitest";
import { hasSupabaseConfig, readPublicEnv } from "../lib/validation/env";

describe("public environment validation", () => {
  it("uses the local app URL default and identifies incomplete Supabase configuration", () => {
    const env = readPublicEnv({});
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(hasSupabaseConfig(env)).toBe(false);
  });
  it("accepts a complete public Supabase configuration", () => {
    const env = readPublicEnv({
      NEXT_PUBLIC_APP_URL: "https://moneylau.example",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });
    expect(hasSupabaseConfig(env)).toBe(true);
  });
});
