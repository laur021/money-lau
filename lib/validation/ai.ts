import { z } from "zod";

const privateAiEnvSchema = z.object({
  AI_INSIGHTS_MONTHLY_REQUEST_LIMIT: z.coerce.number().int().min(1).max(500).default(40),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_MODEL: z.string().trim().min(1).max(120).default("deepseek-chat"),
});

export type PrivateAiEnv = z.infer<typeof privateAiEnvSchema>;

export function readPrivateAiEnv(
  source: Record<string, string | undefined> = process.env,
): PrivateAiEnv {
  return privateAiEnvSchema.parse(source);
}

export function hasDeepSeekConfig(
  env = readPrivateAiEnv(),
): env is PrivateAiEnv & { DEEPSEEK_API_KEY: string } {
  return Boolean(env.DEEPSEEK_API_KEY);
}
