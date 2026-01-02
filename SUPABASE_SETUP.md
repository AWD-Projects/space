# Configuración de Supabase para SPACE

## 1. Deshabilitar confirmación de email (para desarrollo)

Para permitir el registro automático sin confirmación de email:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** > **Providers**
3. Haz clic en **Email** en la lista de providers
4. Desactiva la opción **"Confirm email"** (desmarca el checkbox)
5. Haz clic en **Save**

**Nota:** En producción, deberías mantener la confirmación de email activada y configurar templates de email personalizados.

## 2. Configurar URL del sitio (opcional)

1. Ve a **Authentication** > **URL Configuration**
2. Establece la **Site URL**: `http://localhost:3000` (desarrollo) o tu dominio (producción)
3. Agrega **Redirect URLs** permitidas si es necesario

## 3. Aplicar el esquema de base de datos

Ejecuta el SQL completo que está en el `README.md` en:
1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Crea un nuevo query
3. Pega todo el código SQL del README.md
4. Ejecuta el query (botón **Run**)

El esquema incluye:
- Tablas: stores, catalogs, products, product_images, events
- Enums: store_status, product_status, etc.
- Políticas RLS (Row Level Security)
- Storage buckets y políticas
- Triggers y funciones

## 4. Variables de entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Puedes encontrar estos valores en:
**Project Settings** > **API** > **Project URL** y **anon public**

## 5. Verificar que todo funciona

1. Reinicia tu servidor de desarrollo: `npm run dev`
2. Ve a `/signup` y crea una cuenta
3. Deberías ser redirigido automáticamente a `/onboarding` sin necesidad de confirmar el email
4. Si hay errores, revisa la consola y los logs de Supabase

---

## Configuración para Producción

Cuando despliegues a producción:

1. **Reactivar confirmación de email**:
   - Ve a Authentication > Providers > Email
   - Activa "Confirm email"
   - Configura templates de email personalizados en Authentication > Email Templates

2. **Configurar dominio**:
   - Actualiza la Site URL con tu dominio real
   - Agrega todas las redirect URLs necesarias

3. **Políticas de seguridad**:
   - Revisa todas las políticas RLS
   - Verifica que los buckets de storage tengan las políticas correctas
   - Habilita rate limiting si es necesario

4. **Variables de entorno**:
   - Actualiza las variables en tu plataforma de hosting (Vercel, etc.)
   - Nunca expongas las service role keys en el cliente
