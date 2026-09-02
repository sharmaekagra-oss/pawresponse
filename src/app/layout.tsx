import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentProfile } from "@/lib/current-user";
import { logout } from "@/app/auth/actions";
import PawMark from "@/components/PawMark";

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-body",
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
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-slate-700">
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-cream/90 px-6 py-4 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-5xl items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
            >
              <span className="tilt--3 hover:animate-wag inline-flex h-9 w-9 items-center justify-center">
                <PawMark className="h-8 w-8 text-pink-500" />
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
        <main className="paw-pattern flex-1 bg-cream">{children}</main>
      </body>
    </html>
  );
}
