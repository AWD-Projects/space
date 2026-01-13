import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

type IndexSpec = {
  name?: string;
  key: Record<string, number | "text">;
  unique?: boolean;
};

type CollectionSpec = {
  name: string;
  validator: Record<string, unknown>;
  indexes: IndexSpec[];
};

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const collections: CollectionSpec[] = [
  {
    name: "stores",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["owner_id", "name", "slug", "status", "template", "primary_color", "accent_color", "default_cta", "created_at", "updated_at"],
        properties: {
          owner_id: { bsonType: "string" },
          name: { bsonType: "string" },
          slug: { bsonType: "string" },
          description: { bsonType: ["string", "null"] },
          status: { enum: ["draft", "published"] },
          template: { enum: ["minimal", "visual", "compact"] },
          primary_color: { bsonType: "string" },
          accent_color: { bsonType: "string" },
          logo_path: { bsonType: ["string", "null"] },
          default_cta: { enum: ["whatsapp", "payment_link", "contact"] },
          whatsapp_phone: { bsonType: ["string", "null"] },
          default_payment_url: { bsonType: ["string", "null"] },
          contact_email: { bsonType: ["string", "null"] },
          contact_url: { bsonType: ["string", "null"] },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { slug: 1 }, unique: true, name: "stores_slug_unique" },
      { key: { owner_id: 1 }, unique: true, name: "stores_owner_unique" },
    ],
  },
  {
    name: "catalogs",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["store_id", "name", "slug", "sort_order", "visible", "created_at", "updated_at"],
        properties: {
          store_id: { bsonType: "string" },
          name: { bsonType: "string" },
          slug: { bsonType: "string" },
          sort_order: { bsonType: "int" },
          visible: { bsonType: "bool" },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { store_id: 1, slug: 1 }, unique: true, name: "catalogs_store_slug_unique" },
    ],
  },
  {
    name: "products",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["store_id", "name", "slug", "status", "stock", "out_of_stock_behavior", "sort_order", "created_at", "updated_at"],
        properties: {
          store_id: { bsonType: "string" },
          catalog_id: { bsonType: ["string", "null"] },
          name: { bsonType: "string" },
          slug: { bsonType: "string" },
          description: { bsonType: ["string", "null"] },
          price_text: { bsonType: ["string", "null"] },
          status: { enum: ["active", "hidden"] },
          stock: { bsonType: "int" },
          out_of_stock_behavior: { enum: ["label", "auto_hide"] },
          cta_override: { enum: ["whatsapp", "payment_link", "contact", null] },
          payment_url: { bsonType: ["string", "null"] },
          whatsapp_message: { bsonType: ["string", "null"] },
          contact_url: { bsonType: ["string", "null"] },
          sort_order: { bsonType: "int" },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { store_id: 1, slug: 1 }, unique: true, name: "products_store_slug_unique" },
      { key: { name: "text", description: "text" }, name: "products_text_search" },
    ],
  },
  {
    name: "product_images",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["product_id", "path", "sort_order", "created_at"],
        properties: {
          product_id: { bsonType: "string" },
          path: { bsonType: "string" },
          alt_text: { bsonType: ["string", "null"] },
          sort_order: { bsonType: "int" },
          created_at: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { product_id: 1 }, name: "product_images_product_id" },
    ],
  },
  {
    name: "events",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["store_id", "kind", "occurred_at"],
        properties: {
          store_id: { bsonType: "string" },
          product_id: { bsonType: ["string", "null"] },
          kind: { enum: ["store_view", "product_view", "search", "cta_click"] },
          occurred_at: { bsonType: "date" },
          session_id: { bsonType: ["string", "null"] },
          query: { bsonType: ["string", "null"] },
          cta_kind: { enum: ["whatsapp", "payment_link", "contact", null] },
          client_hash: { bsonType: ["string", "null"] },
        },
      },
    },
    indexes: [
      { key: { store_id: 1, kind: 1, occurred_at: -1 }, name: "events_store_kind_occurred" },
    ],
  },
  {
    name: "plans",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["code", "name", "monthly_price_mxn", "branding_visible", "analytics_level", "created_at"],
        properties: {
          code: { enum: ["starter", "growth", "pro"] },
          name: { bsonType: "string" },
          monthly_price_mxn: { bsonType: "int" },
          max_products: { bsonType: ["int", "null"] },
          max_catalogs: { bsonType: ["int", "null"] },
          branding_visible: { bsonType: "bool" },
          analytics_level: { bsonType: "int" },
          created_at: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { code: 1 }, unique: true, name: "plans_code_unique" },
    ],
  },
  {
    name: "subscriptions",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["user_id", "plan_code", "status", "trial_started_at", "trial_ends_at", "created_at", "updated_at"],
        properties: {
          user_id: { bsonType: "string" },
          plan_code: { enum: ["starter", "growth", "pro"] },
          status: { enum: ["trialing", "active", "past_due", "canceled"] },
          trial_started_at: { bsonType: "date" },
          trial_ends_at: { bsonType: "date" },
          current_period_starts_at: { bsonType: ["date", "null"] },
          current_period_ends_at: { bsonType: ["date", "null"] },
          stripe_customer_id: { bsonType: ["string", "null"] },
          stripe_subscription_id: { bsonType: ["string", "null"] },
          stripe_price_id: { bsonType: ["string", "null"] },
          cancel_at_period_end: { bsonType: "bool" },
          canceled_at: { bsonType: ["date", "null"] },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { user_id: 1 }, unique: true, name: "subscriptions_user_unique" },
      { key: { stripe_customer_id: 1 }, name: "subscriptions_stripe_customer" },
    ],
  },
];

async function ensureCollection(db: mongoose.mongo.Db, spec: CollectionSpec) {
  const existing = await db.listCollections({ name: spec.name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(spec.name, {
      validator: spec.validator,
      validationLevel: "moderate",
    });
    console.log(`Created collection: ${spec.name}`);
  } else {
    await db.command({
      collMod: spec.name,
      validator: spec.validator,
      validationLevel: "moderate",
    });
    console.log(`Validated collection: ${spec.name}`);
  }

  const collection = db.collection(spec.name);
  if (spec.indexes.length > 0) {
    await collection.createIndexes(
      spec.indexes.map((index) => ({
        key: index.key,
        name: index.name,
        ...(index.unique !== undefined ? { unique: index.unique } : {}),
      }))
    );
  }
  console.log(`Indexes ensured: ${spec.name}`);
}

async function main() {
  await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection not established");
  }

  for (const spec of collections) {
    console.log(`Ensuring collection: ${spec.name}`);
    await ensureCollection(db, spec);
  }

  await mongoose.disconnect();
  console.log("Database initialization complete.");
}

main().catch((error) => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});
