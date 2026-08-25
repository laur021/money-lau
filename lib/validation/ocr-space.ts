import { z } from "zod";

const ocrSpaceEnvSchema = z.object({
  OCR_SPACE_API_KEY: z.string().trim().min(1).optional(),
});

export type OcrSpaceEnv = z.infer<typeof ocrSpaceEnvSchema>;

export function readOcrSpaceEnv(source: Record<string, string | undefined> = process.env): OcrSpaceEnv {
  return ocrSpaceEnvSchema.parse(source);
}

export function hasOcrSpaceConfig(env = readOcrSpaceEnv()): env is OcrSpaceEnv & { OCR_SPACE_API_KEY: string } {
  return Boolean(env.OCR_SPACE_API_KEY);
}
