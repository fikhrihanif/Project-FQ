import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Izinkan API routes, static Next assets, dan berkas Flutter Web tanpa cegatan
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/mobile") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Arahkan SELURUH halaman UI ke Aplikasi Flutter Web (/mobile/index.html)
  return NextResponse.rewrite(new URL("/mobile/index.html", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
