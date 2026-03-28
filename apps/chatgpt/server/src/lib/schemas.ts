import { z } from "zod";

export const intentSchema = z.enum(["web", "social", "print", "archive", "custom"]);
export const preferredFormatSchema = z.enum(["jpeg", "png", "webp", "tiff"]);

export const openWorkspaceInputSchema = z.object({
  intent: intentSchema.default("web"),
  preferred_format: preferredFormatSchema.optional(),
  max_long_edge: z.number().int().min(1).max(12000).optional(),
});

export const sourceImageSchema = z.object({
  download_url: z.string().url(),
  file_id: z.string().min(1),
});

export const analyzeSourceInputSchema = z.object({
  source_image: sourceImageSchema,
  intent: intentSchema.optional(),
});

export const recommendPresetInputSchema = z.object({
  intent: intentSchema,
  source_format: z.string().optional(),
  original_width: z.number().int().positive().optional(),
  original_height: z.number().int().positive().optional(),
  has_transparency: z.boolean().optional(),
  max_file_size_mb: z.number().positive().optional(),
});

export const inspectSupportInputSchema = z.object({
  file_name: z.string().optional(),
  mime_type: z.string().optional(),
  extension: z.string().optional(),
});

export const reportResultInputSchema = z.object({
  session_id: z.string().min(1),
  source_format: z.string().min(1),
  target_format: z.string().min(1),
  source_bytes: z.number().int().nonnegative(),
  result_bytes: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  download_name: z.string().min(1),
  warnings: z.array(z.string()).optional(),
});
