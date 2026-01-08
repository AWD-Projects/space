# SPACE - Catálogo Digital Premium

Un SaaS premium para crear catálogos digitales profesionales. Permite a cualquier vendedor tener un catálogo público y compartible con un dashboard elegante para gestionar productos, inventario y analytics.

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Base de Datos**: Supabase (Postgres)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: TailwindCSS + shadcn/ui
- **Animaciones**: Framer Motion + GSAP
- **Validación**: Zod
- **Forms**: React Hook Form

## Características Principales

- Sistema de autenticación (Email + Password)
- Onboarding guiado en 6 pasos
- Dashboard admin con 5 secciones:
  - **Home**: Analytics y KPIs (vistas, clicks, productos)
  - **Products**: CRUD completo de productos con inventario
  - **Catalogs**: Gestión de catálogos/categorías
  - **Branding**: Personalización visual (colores, template, CTA)
  - **Preview**: Vista previa del catálogo público
- Catálogo público SSR con 3 templates (Minimal, Grid, List)
- Sistema de analytics automático (vistas, búsquedas, clicks)
- Búsqueda de productos en tiempo real
- CTAs configurables (WhatsApp, Payment Link, Contact)
- Gestión de stock e inventario
- Multi-tenant (cada usuario tiene su tienda)

## Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratis)

## Instalación

### 1. Clonar/Descargar el Proyecto

```bash
cd space
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva organización y proyecto
3. Espera a que el proyecto se inicialice

#### Ejecutar el Schema SQL

1. Ve a SQL Editor en tu proyecto de Supabase
2. Copia y ejecuta el siguiente SQL para crear todas las tablas, enums, políticas RLS, índices y triggers:

```sql
-- Enums
CREATE TYPE store_status AS ENUM ('draft', 'published');
CREATE TYPE template_kind AS ENUM ('minimal', 'visual', 'compact');
CREATE TYPE cta_kind AS ENUM ('whatsapp', 'payment_link', 'contact');
CREATE TYPE product_status AS ENUM ('active', 'hidden');
CREATE TYPE event_kind AS ENUM ('store_view', 'product_view', 'search', 'cta_click');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');

-- Tabla stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description TEXT,
  status store_status NOT NULL DEFAULT 'draft',
  template template_kind NOT NULL DEFAULT 'minimal',
  primary_color TEXT NOT NULL DEFAULT '#111111' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color TEXT NOT NULL DEFAULT '#6B7280' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_path TEXT,
  default_cta cta_kind NOT NULL DEFAULT 'whatsapp',
  whatsapp_phone TEXT,
  default_payment_url TEXT,
  contact_email TEXT,
  contact_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id)
);

-- Tabla store_social_links
CREATE TABLE store_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','facebook','tiktok','youtube','x','whatsapp','website')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, platform)
);

-- Tabla catalogs
CREATE TABLE catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Tabla products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  catalog_id UUID REFERENCES catalogs(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description TEXT,
  price_text TEXT,
  status product_status NOT NULL DEFAULT 'active',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  out_of_stock_behavior TEXT NOT NULL DEFAULT 'label' CHECK (out_of_stock_behavior IN ('label','auto_hide')),
  cta_override cta_kind,
  payment_url TEXT,
  whatsapp_message TEXT,
  contact_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Tabla product_images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, path)
);

-- Tabla events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  kind event_kind NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  query TEXT,
  cta_kind cta_kind,
  client_hash TEXT,
  CHECK (kind != 'search' OR query IS NOT NULL),
  CHECK (kind != 'cta_click' OR cta_kind IS NOT NULL)
);

-- Tabla plans
CREATE TABLE plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price_mxn INTEGER NOT NULL,
  max_products INTEGER,
  max_catalogs INTEGER,
  branding_visible BOOLEAN NOT NULL DEFAULT true,
  analytics_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES plans(code) DEFAULT 'pro',
  status subscription_status NOT NULL DEFAULT 'trialing',
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  current_period_starts_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_catalogs_store ON catalogs(store_id);
CREATE INDEX idx_catalogs_visible ON catalogs(visible);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_catalog ON products(catalog_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_events_store_kind_occurred ON events(store_id, kind, occurred_at DESC);
CREATE INDEX idx_events_product_kind_occurred ON events(product_id, kind, occurred_at DESC);

-- RLS Policies

-- stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD their stores"
  ON stores FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Public can view published stores"
  ON stores FOR SELECT
  USING (status = 'published');

-- catalogs
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD their catalogs"
  ON catalogs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = catalogs.store_id AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = catalogs.store_id AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view visible catalogs of published stores"
  ON catalogs FOR SELECT
  USING (visible = true AND EXISTS (
    SELECT 1 FROM stores WHERE stores.id = catalogs.store_id AND stores.status = 'published'
  ));

-- products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD their products"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view active products of published stores"
  ON products FOR SELECT
  USING (status = 'active' AND EXISTS (
    SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.status = 'published'
  ));

-- product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD their product images"
  ON product_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM products
    JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_images.product_id AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_images.product_id AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view images of active products"
  ON product_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products
    JOIN stores ON stores.id = products.store_id
    WHERE products.id = product_images.product_id
      AND products.status = 'active'
      AND stores.status = 'published'
  ));

-- store_social_links
ALTER TABLE store_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD their social links"
  ON store_social_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = store_social_links.store_id AND stores.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = store_social_links.store_id AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view social links of published stores"
  ON store_social_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = store_social_links.store_id AND stores.status = 'published'
  ));

-- events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events for published stores"
  ON events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = events.store_id AND stores.status = 'published'
  ));

CREATE POLICY "Owners can view their store events"
  ON events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = events.store_id AND stores.owner_id = auth.uid()
  ));

-- plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view plans"
  ON plans FOR SELECT
  USING (true);

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para crear subscription al crear usuario
CREATE OR REPLACE FUNCTION create_subscription_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_code, status)
  VALUES (NEW.id, 'pro', 'trialing');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_for_user();

-- Datos iniciales
INSERT INTO plans (code, name, monthly_price_mxn) VALUES
  ('pro', 'Pro', 0);
```

#### Configurar Storage

1. Ve a **Storage** en Supabase
2. Crea un nuevo bucket llamado `public-images`
3. Haz el bucket público
4. Configura las políticas de storage:

```sql
-- Storage policies para public-images bucket

-- Lectura pública
CREATE POLICY "Public can read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-images');

-- Upload solo autenticados en su propia tienda
CREATE POLICY "Authenticated users can upload to their store"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2]::uuid IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Update solo del owner
CREATE POLICY "Owners can update their store images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'public-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2]::uuid IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Delete solo del owner
CREATE POLICY "Owners can delete their store images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'public-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'stores'
    AND (storage.foldername(name))[2]::uuid IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Puedes encontrar estas credenciales en:
- Supabase Dashboard → Settings → API → Project URL
- Supabase Dashboard → Settings → API → Project API keys → anon/public

### 5. Iniciar el Proyecto

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Uso

### Primera vez

1. Ve a [http://localhost:3000](http://localhost:3000)
2. Serás redirigido a `/login`
3. Haz clic en "Regístrate" para crear una cuenta
4. Completa el onboarding guiado (6 pasos):
   - Crear tienda (nombre, slug, descripción, color)
   - Elegir template visual
   - Configurar CTA por defecto
   - Crear primer catálogo
   - Crear primer producto
   - Publicar tienda
5. Al finalizar, tendrás tu catálogo público en `http://localhost:3000/tu-slug`

### Dashboard

Una vez completado el onboarding, accederás al dashboard admin:

- **Home**: Ve analytics, KPIs, top products
- **Products**: Crea, edita y gestiona productos
- **Catalogs**: Organiza productos en catálogos
- **Branding**: Personaliza colores, template, CTA
- **Preview**: Vista previa de tu catálogo público

### Catálogo Público

Tu catálogo será accesible en:
- `http://localhost:3000/tu-slug` - Página principal
- `http://localhost:3000/tu-slug/catalog/nombre-catalogo` - Catálogo específico
- `http://localhost:3000/tu-slug/product/nombre-producto` - Producto específico

## Estructura del Proyecto

```
space/
├── app/
│   ├── (auth)/           # Rutas de autenticación
│   │   ├── login/
│   │   └── signup/
│   ├── app/              # Dashboard admin (protegido)
│   │   ├── home/
│   │   ├── products/
│   │   ├── catalogs/
│   │   ├── branding/
│   │   └── preview/
│   ├── onboarding/       # Wizard de onboarding
│   ├── (public)/[store_slug]/     # Catálogo público SSR
│   │   ├── catalog/[catalog_slug]/
│   │   └── product/[product_slug]/
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Sidebar, etc.
│   └── public/           # Componentes del catálogo público
├── lib/
│   ├── actions/          # Server Actions
│   ├── supabase/         # Clientes de Supabase
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilidades
│   └── validators/       # Zod schemas
├── styles/
│   ├── globals.css
│   └── tokens.css
└── middleware.ts         # Protección de rutas
```

## Tecnologías y Decisiones

- **Next.js App Router**: SSR, Server Actions, routing moderno
- **Supabase**: Backend completo (DB, Auth, Storage)
- **TypeScript**: Type safety
- **TailwindCSS**: Styling utility-first
- **shadcn/ui**: Componentes accesibles y customizables
- **RLS**: Row Level Security para multi-tenancy seguro
- **Server Actions**: Mutaciones seguras sin API routes
- **Zod**: Validación runtime type-safe

## Analytics

El sistema trackea automáticamente:
- Vistas de tienda
- Vistas de producto
- Búsquedas
- Clicks en CTAs

Los datos se almacenan en la tabla `events` y se muestran en el dashboard.

## Deployment

### Vercel (Recomendado)

1. Push el código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno (`.env.local`)
4. Deploy

### Otras plataformas

Compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Render
- etc.

## Soporte

Para reportar bugs o solicitar features, crea un issue en el repositorio.

## Licencia

ISC
# space
