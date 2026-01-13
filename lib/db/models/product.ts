import { Schema, model, models, type Model } from "mongoose";

export type ProductDocument = {
  _id?: string;
  store_id: string;
  catalog_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price_text?: string | null;
  status: "active" | "hidden";
  stock: number;
  out_of_stock_behavior: "label" | "auto_hide";
  cta_override?: "whatsapp" | "payment_link" | "contact" | null;
  payment_url?: string | null;
  whatsapp_message?: string | null;
  contact_url?: string | null;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
};

const productSchema = new Schema<ProductDocument>(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    store_id: { type: String, required: true, index: true },
    catalog_id: { type: String, default: null },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: null },
    price_text: { type: String, default: null },
    status: { type: String, enum: ["active", "hidden"], default: "active" },
    stock: { type: Number, default: 0 },
    out_of_stock_behavior: { type: String, enum: ["label", "auto_hide"], default: "label" },
    cta_override: { type: String, enum: ["whatsapp", "payment_link", "contact"], default: null },
    payment_url: { type: String, default: null },
    whatsapp_message: { type: String, default: null },
    contact_url: { type: String, default: null },
    sort_order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

productSchema.index({ store_id: 1, slug: 1 }, { unique: true });
productSchema.index({ name: "text", description: "text" });

export const ProductModel: Model<ProductDocument> =
  models.Product || model<ProductDocument>("Product", productSchema);
