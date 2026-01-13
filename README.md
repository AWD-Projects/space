# SPACE - Catálogo Digital Premium

Un SaaS premium para crear catálogos digitales profesionales. Permite a cualquier vendedor tener un catálogo público y compartible con un dashboard elegante para gestionar productos, inventario y analytics.

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Base de Datos**: MongoDB (Mongoose)
- **Autenticación**: Clerk (Email/Password + Google OAuth)
- **Storage**: Supabase Storage (storage-only, bucket público)
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
- Gestión de planes y facturación con Stripe (trial automático de 30 días)

### Planes actuales

| Plan     | Precio (MXN/mes) | Límites principales                                   |
|----------|------------------|-------------------------------------------------------|
| Starter  | $0               | 1 tienda, 20 productos, 2 catálogos, branding visible |
| Growth   | $149             | 200 productos, 10 catálogos, sin branding, soporte prior. |
| Pro      | $299             | Ilimitado, analytics avanzadas, soporte premium       |

Todas las cuentas nuevas inician en **Pro** con 30 días gratis. Si no se agrega un método de pago, se degradan automáticamente a Starter al terminar la prueba. Las actualizaciones y cancelaciones se realizan vía Stripe Checkout + Customer Portal.

## Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Clerk (gratis)
- MongoDB Atlas o instancia local
- Proyecto Supabase solo para Storage

## Instalación

### 1. Clonar/Descargar el Proyecto

```bash
cd space
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar MongoDB

1. Crea un cluster en MongoDB Atlas o usa una instancia local.
2. Copia el connection string y guárdalo en `MONGODB_URI`.

### 4. Configurar Clerk

1. Crea una aplicación en [clerk.com](https://clerk.com)
2. Habilita Email/Password y Google OAuth.
3. Copia las claves y define las variables `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.

### 5. Configurar Supabase Storage (storage-only)

1. Crea un proyecto dedicado a Storage en Supabase.
2. Crea el bucket público `public-images`.
3. No agregues policies (las subidas se realizan con Signed Upload URLs desde el backend).

### 6. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tus credenciales:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

MONGODB_URI=mongodb+srv://...

NEXT_PUBLIC_STORAGE_SUPABASE_URL=https://tu-storage-only.supabase.co
NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY=tu-anon-key
STORAGE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
STORAGE_BUCKET=public-images
```

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
│   ├── db/               # Modelos y conexión MongoDB
│   ├── storage/          # Clientes de storage (Supabase storage-only)
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
- **MongoDB + Clerk**: Separación de Auth y DB con control multi-tenant
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

## Checklist de verificación manual

- Login con email/password (Clerk)
- Login con Google OAuth
- Onboarding completo (store, catálogo, producto, publicación)
- Crear/editar productos y catálogos en `/app/*`
- Subir imágenes (logo/producto) con Signed Upload URL y verificar lectura pública
- Catálogo público: navegación, búsqueda y filtros por catálogo
- Dashboard: métricas y eventos básicos
- Webhooks de Stripe actualizan el plan en MongoDB

## Soporte

Para reportar bugs o solicitar features, crea un issue en el repositorio.

## Licencia

ISC
# space
