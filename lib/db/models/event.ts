import { Schema, model, models, type Model } from "mongoose";

export type EventDocument = {
  store_id: string;
  product_id?: string | null;
  kind: "store_view" | "product_view" | "search" | "cta_click";
  occurred_at: Date;
  session_id?: string | null;
  query?: string | null;
  cta_kind?: "whatsapp" | "payment_link" | "contact" | null;
  client_hash?: string | null;
};

const eventSchema = new Schema<EventDocument>({
  store_id: { type: String, required: true, index: true },
  product_id: { type: String, default: null, index: true },
  kind: {
    type: String,
    enum: ["store_view", "product_view", "search", "cta_click"],
    required: true,
    index: true,
  },
  occurred_at: { type: Date, required: true, default: Date.now, index: true },
  session_id: { type: String, default: null },
  query: { type: String, default: null },
  cta_kind: { type: String, enum: ["whatsapp", "payment_link", "contact"], default: null },
  client_hash: { type: String, default: null },
});

eventSchema.index({ store_id: 1, kind: 1, occurred_at: -1 });

export const EventModel: Model<EventDocument> =
  models.Event || model<EventDocument>("Event", eventSchema);
