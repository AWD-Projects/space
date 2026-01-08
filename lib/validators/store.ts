import { z } from "zod";

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido");

const storeBaseSchema = {
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(60, "El nombre no puede exceder 60 caracteres"),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe ser en formato kebab-case"),
  description: z.string().nullable().optional(),
  primary_color: colorSchema,
  accent_color: colorSchema,
  default_cta: z.enum(["whatsapp", "payment_link", "contact"]),
  whatsapp_phone: z.string().nullable().optional(),
  default_payment_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  contact_email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  contact_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
};

export const createStoreSchema = z.object({
  ...storeBaseSchema,
  primary_color: colorSchema.default("#111111"),
  accent_color: colorSchema.default("#6B7280"),
  default_cta: storeBaseSchema.default_cta.default("whatsapp"),
});

export const updateStoreSchema = z.object(storeBaseSchema).partial();

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
