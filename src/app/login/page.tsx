import Link from "next/link";
import { login } from "@/app/auth/actions";
import GoogleButton from "@/app/auth/GoogleButton";
import BackButton from "@/app/auth/BackButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm animate-fade-in-up flex-col justify-center gap-6 px-4">
      <BackButton />
      <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="icon-badge hover:animate-wag h-12 w-12 bg-gradient-to-br from-pink-100 to-rose-100 text-2xl">
            🐾
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        </div>
        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form action={login} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-slate-500">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-slate-500">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <button
            type="submit"
            className="btn-press btn-gradient rounded px-3 py-2 font-semibold text-white"
          >
            Log in
          </button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          or
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleButton />
        <p className="mt-5 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/signup" className="text-pink-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
