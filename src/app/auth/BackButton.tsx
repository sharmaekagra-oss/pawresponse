"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const baseClass =
  "mb-4 inline-flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-pink-600";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        ← Back
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={baseClass}>
      ← Back
    </button>
  );
}
