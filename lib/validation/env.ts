import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export function readPublicEnv(source: Record<string, string | undefined> = process.env): PublicEnv { return publicEnvSchema.parse(source); }
export function hasSupabaseConfig(env = readPublicEnv()): env is PublicEnv & { NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string } { return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
