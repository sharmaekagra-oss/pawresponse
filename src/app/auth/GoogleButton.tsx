"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleButton() {
  const handleClick = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50"
    >
      Continue with Google
    </button>
  );
}
