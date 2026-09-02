import Link from "next/link";
import { signup } from "@/app/auth/actions";
import GoogleButton from "@/app/auth/GoogleButton";
import NameFields from "@/app/auth/NameFields";
import PhoneField from "@/app/auth/PhoneField";
import BackButton from "@/app/auth/BackButton";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm animate-scale-in flex-col justify-center gap-4 px-4 text-center">
        <span className="text-4xl">📬</span>
        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
        <p className="text-slate-500">
          We sent a confirmation link to your inbox. Click it to activate your account,
          then come back and log in.
        </p>
        <Link href="/login" className="text-pink-600 hover:underline">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm animate-fade-in-up flex-col justify-center gap-6 px-4 py-10">
      <BackButton />
      <h1 className="text-2xl font-bold text-slate-900">Sign up</h1>
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={signup} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm text-slate-500">I am a...</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-slate-700 has-[:checked]:border-pink-400 has-[:checked]:bg-pink-50">
              <input type="radio" name="role" value="owner" defaultChecked required />
              Pet owner
            </label>
            <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-slate-700 has-[:checked]:border-pink-400 has-[:checked]:bg-pink-50">
              <input type="radio" name="role" value="paravet" required />
              Paravet
            </label>
          </div>
        </fieldset>
        <NameFields />
        <PhoneField />
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
            minLength={6}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>
        <button
          type="submit"
          className="btn-press rounded bg-pink-500 px-3 py-2 font-semibold text-white hover:bg-pink-600"
        >
          Create account
        </button>
      </form>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleButton />
      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-pink-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
