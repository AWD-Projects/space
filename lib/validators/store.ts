import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(60, "El nombre no puede exceder 60 caracteres"),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe ser en formato kebab-case"),
  description: z.string().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").default("#111111"),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").default("#6B7280"),
  default_cta: z.enum(["whatsapp", "payment_link", "contact"]).default("whatsapp"),
  whatsapp_phone: z.string().nullable().optional(),
  default_payment_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  contact_email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  contact_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
});

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
