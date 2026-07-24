import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Izinkan semua API routes Next.js
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2. Arahkan semua halaman UI ke /index.html (Flutter Web App)
  if (!pathname.includes(".")) {
    return NextResponse.rewrite(new URL("/index.html", req.url));
  }

  // 3. Izinkan semua berkas statis Flutter Web (JS, WASM, assets)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image).*)"],
};
