import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().nullable().optional(),
  price_text: z.string().nullable().optional(),
  catalog_id: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "hidden"]).default("active"),
  stock: z.number().int().min(0).default(0),
  out_of_stock_behavior: z.enum(["label", "auto_hide"]).default("label"),
  cta_override: z.enum(["whatsapp", "payment_link", "contact"]).nullable().optional(),
  payment_url: z.string().url().nullable().optional(),
  whatsapp_message: z.string().nullable().optional(),
  contact_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
