import { z } from "zod";

export const createCatalogSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  visible: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const updateCatalogSchema = createCatalogSchema.partial();

export type CreateCatalogInput = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogInput = z.infer<typeof updateCatalogSchema>;
