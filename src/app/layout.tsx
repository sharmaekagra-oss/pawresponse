import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentProfile } from "@/lib/current-user";
import { logout } from "@/app/auth/actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PawResponse",
  description: "On-call paravet dispatch for home pet emergencies.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-700">
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-white/90 px-6 py-4 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-5xl items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
            >
              <span className="icon-badge hover:animate-wag h-8 w-8 bg-gradient-to-br from-pink-100 to-rose-100 text-base">
                🐾
              </span>
              <span className="text-gradient">PawResponse</span>
            </Link>
            <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
              {profile?.role_confirmed && profile.role === "owner" && (
                <>
                  <Link href="/pets" className="nav-link hover:text-pink-600">
                    My Pets
                  </Link>
                  <Link href="/requests" className="nav-link hover:text-pink-600">
                    Requests
                  </Link>
                  <Link href="/address" className="nav-link hover:text-pink-600">
                    Address
                  </Link>
                  <Link
                    href="/requests/new"
                    className="btn-press btn-gradient-critical rounded px-3 py-1.5 font-semibold text-white"
                  >
                    🚨 Request Visit
                  </Link>
                </>
              )}
              {profile?.role_confirmed && profile.role === "paravet" && (
                <Link href="/queue" className="nav-link hover:text-pink-600">
                  Queue
                </Link>
              )}
              {profile ? (
                <form action={logout}>
                  <button type="submit" className="nav-link hover:text-pink-600">
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/login" className="nav-link hover:text-pink-600">
                    Log in
                  </Link>
                  <Link href="/signup" className="nav-link hover:text-pink-600">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="paw-pattern flex-1 bg-white">{children}</main>
      </body>
    </html>
  );
}
