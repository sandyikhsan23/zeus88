"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  baru: "Berhasil ditambahkan",
  update: "Perubahan disimpan",
  hapus: "Berhasil dihapus",
};

export function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);

  // baca ?saved=... lalu bersihkan dari URL
  useEffect(() => {
    const saved = params.get("saved");
    if (!saved || !MESSAGES[saved]) return;
    setMsg(MESSAGES[saved]);
    const rest = new URLSearchParams(Array.from(params.entries()));
    rest.delete("saved");
    const qs = rest.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-maroon/25 bg-white px-3.5 py-2.5 text-sm font-medium text-maroon shadow-[0_4px_16px_rgba(20,33,61,0.15)]">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {msg}
    </div>
  );
}
