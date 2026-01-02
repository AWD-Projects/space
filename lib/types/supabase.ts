// This file is a placeholder for Supabase generated types
// In production, you would generate this with: npx supabase gen types typescript

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          status: "draft" | "published";
          template: "minimal" | "visual" | "compact";
          primary_color: string;
          accent_color: string;
          logo_path: string | null;
          default_cta: "whatsapp" | "payment_link" | "contact";
          whatsapp_phone: string | null;
          default_payment_url: string | null;
          contact_email: string | null;
          contact_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: "draft" | "published";
          template?: "minimal" | "visual" | "compact";
          primary_color?: string;
          accent_color?: string;
          logo_path?: string | null;
          default_cta?: "whatsapp" | "payment_link" | "contact";
          whatsapp_phone?: string | null;
          default_payment_url?: string | null;
          contact_email?: string | null;
          contact_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          status?: "draft" | "published";
          template?: "minimal" | "visual" | "compact";
          primary_color?: string;
          accent_color?: string;
          logo_path?: string | null;
          default_cta?: "whatsapp" | "payment_link" | "contact";
          whatsapp_phone?: string | null;
          default_payment_url?: string | null;
          contact_email?: string | null;
          contact_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
    Views: {};
    Functions: {};
    Enums: {
      store_status: "draft" | "published";
      template_kind: "minimal" | "visual" | "compact";
      cta_kind: "whatsapp" | "payment_link" | "contact";
      product_status: "active" | "hidden";
      event_kind: "store_view" | "product_view" | "search" | "cta_click";
      subscription_status: "trialing" | "active" | "past_due" | "canceled";
    };
  };
};
