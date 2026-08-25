import { z } from "zod";

const azureReceiptEnvSchema = z.object({
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.string().url().optional(),
  AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string().trim().min(1).optional(),
});

export type AzureReceiptEnv = z.infer<typeof azureReceiptEnvSchema>;

export function readAzureReceiptEnv(source: Record<string, string | undefined> = process.env): AzureReceiptEnv {
  return azureReceiptEnvSchema.parse(source);
}

export function hasAzureReceiptConfig(
  env = readAzureReceiptEnv(),
): env is AzureReceiptEnv & { AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: string; AZURE_DOCUMENT_INTELLIGENCE_KEY: string } {
  return Boolean(env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
}
