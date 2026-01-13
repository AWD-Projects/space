import { Schema, model, models, type Model } from "mongoose";

export type ProductImageDocument = {
  _id?: string;
  product_id: string;
  path: string;
  alt_text?: string | null;
  sort_order: number;
  created_at?: Date;
};

const productImageSchema = new Schema<ProductImageDocument>(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    product_id: { type: String, required: true, index: true },
    path: { type: String, required: true },
    alt_text: { type: String, default: null },
    sort_order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

productImageSchema.index({ product_id: 1, path: 1 }, { unique: true });

export const ProductImageModel: Model<ProductImageDocument> =
  models.ProductImage || model<ProductImageDocument>("ProductImage", productImageSchema);
