import { Schema, model, models, type Model } from "mongoose";

export type CatalogDocument = {
  _id?: string;
  store_id: string;
  name: string;
  slug: string;
  sort_order: number;
  visible: boolean;
  created_at?: Date;
  updated_at?: Date;
};

const catalogSchema = new Schema<CatalogDocument>(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    store_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sort_order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

catalogSchema.index({ store_id: 1, slug: 1 }, { unique: true });

export const CatalogModel: Model<CatalogDocument> =
  models.Catalog || model<CatalogDocument>("Catalog", catalogSchema);
