"use client";

import { useState } from "react";
import Link from "next/link";
import { fieldCls } from "@/app/ui";
import { KATEGORI_DOKUMEN } from "@/lib/constants";

export type DokumenCard = {
  id: string;
  nama: string;
  kategori: string;
  link: string | null;
  catatan: string | null;
  jumlahLamaran: number;
};

export function DokumenGrid({ items }: { items: DokumenCard[] }) {
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("");

  const filtered = items.filter((d) => {
    if (q && !d.nama.toLowerCase().includes(q.toLowerCase())) return false;
    if (kategori && d.kategori !== kategori) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama dokumen…"
          className={`${fieldCls} max-w-xs`}
        />
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className={`${fieldCls} max-w-[200px]`}
        >
          <option value="">Semua kategori</option>
          {KATEGORI_DOKUMEN.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-[13px] text-navy-dim">
          Tidak ada dokumen yang cocok.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/dokumen/${d.id}`}
              className="group flex flex-col rounded-lg border border-line border-l-2 border-l-line bg-white px-3 py-2.5 hover:border-l-maroon hover:shadow-[0_1px_3px_rgba(18,31,58,0.06)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-navy">{d.nama}</span>
                <span className="shrink-0 rounded-md border border-line bg-sink px-1.5 py-0.5 text-[11px] text-navy-dim">
                  {d.kategori}
                </span>
              </div>
              {d.catatan && (
                <p className="mt-1 line-clamp-2 text-[13px] text-navy-dim">{d.catatan}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[12px] text-navy-dim">
                <span className="rounded-md bg-sink px-1.5 py-0.5">
                  {d.jumlahLamaran} lamaran
                </span>
                {d.link && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(d.link!, "_blank", "noreferrer");
                    }}
                    className="font-medium text-maroon hover:underline"
                  >
                    link ↗
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-2 text-[12px] text-navy-dim">
        {filtered.length} dari {items.length} dokumen
      </p>
    </div>
  );
}
