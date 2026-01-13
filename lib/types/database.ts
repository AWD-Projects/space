// Database Types - Shared domain types

export type StoreStatus = "draft" | "published";
export type TemplateKind = "minimal" | "visual" | "compact";
export type CtaKind = "whatsapp" | "payment_link" | "contact";
export type ProductStatus = "active" | "hidden";
export type EventKind = "store_view" | "product_view" | "search" | "cta_click";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type PlanCode = "starter" | "growth" | "pro";
export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "whatsapp" | "website";
export type OutOfStockBehavior = "label" | "auto_hide";

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: StoreStatus;
  template: TemplateKind;
  primary_color: string;
  accent_color: string;
  logo_path: string | null;
  default_cta: CtaKind;
  whatsapp_phone: string | null;
  default_payment_url: string | null;
  contact_email: string | null;
  contact_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreSocialLink {
  id: string;
  store_id: string;
  platform: SocialPlatform;
  url: string;
  created_at: string;
}

export interface Catalog {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  catalog_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_text: string | null;
  status: ProductStatus;
  stock: number;
  out_of_stock_behavior: OutOfStockBehavior;
  cta_override: CtaKind | null;
  payment_url: string | null;
  whatsapp_message: string | null;
  contact_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  path: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface Event {
  id: string;
  store_id: string;
  product_id: string | null;
  kind: EventKind;
  occurred_at: string;
  session_id: string | null;
  query: string | null;
  cta_kind: CtaKind | null;
  client_hash: string | null;
}

export interface Plan {
  code: PlanCode;
  name: string;
  monthly_price_mxn: number;
  max_products: number | null;
  max_catalogs: number | null;
  branding_visible: boolean;
  analytics_level: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_code: PlanCode;
  status: SubscriptionStatus;
  trial_started_at: string;
  trial_ends_at: string;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export interface CatalogWithProducts extends Catalog {
  products: Product[];
}

export interface StoreWithRelations extends Store {
  catalogs: Catalog[];
  social_links: StoreSocialLink[];
}
