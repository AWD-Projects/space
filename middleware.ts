import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected dashboard routes
  const protectedRoutes = ["/home", "/products", "/catalogs", "/branding", "/preview", "/onboarding"];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Auth routes (login/signup) - redirect if already authenticated
  if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) {
    if (user) {
      // Check if user has a store
      const { data: store } = await supabase
        .from("stores")
        .select("id, status")
        .eq("owner_id", user.id)
        .single();

      if (!store) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
