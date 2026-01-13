import { Schema, model, models, type Model } from "mongoose";

export type StoreDocument = {
  _id?: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: "draft" | "published";
  template: "minimal" | "visual" | "compact";
  primary_color: string;
  accent_color: string;
  logo_path?: string | null;
  default_cta: "whatsapp" | "payment_link" | "contact";
  whatsapp_phone?: string | null;
  default_payment_url?: string | null;
  contact_email?: string | null;
  contact_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
};

const storeSchema = new Schema<StoreDocument>(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    owner_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    template: { type: String, enum: ["minimal", "visual", "compact"], default: "minimal" },
    primary_color: { type: String, required: true, default: "#111111" },
    accent_color: { type: String, required: true, default: "#6B7280" },
    logo_path: { type: String, default: null },
    default_cta: { type: String, enum: ["whatsapp", "payment_link", "contact"], default: "whatsapp" },
    whatsapp_phone: { type: String, default: null },
    default_payment_url: { type: String, default: null },
    contact_email: { type: String, default: null },
    contact_url: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes are defined via field-level unique constraints.

export const StoreModel: Model<StoreDocument> =
  models.Store || model<StoreDocument>("Store", storeSchema);
