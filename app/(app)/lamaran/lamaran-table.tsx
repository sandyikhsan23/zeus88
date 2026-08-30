"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, fieldCls } from "@/app/ui";
import { STATUS_LAMARAN, formatTanggal, isStale } from "@/lib/constants";

export type LamaranRow = {
  id: string;
  perusahaan: string;
  posisi: string;
  status: string;
  sumberLowongan: string | null;
  tanggalMelamar: string;
  updateTerakhir: string;
  jumlahDokumen: number;
};

export function LamaranTable({ rows }: { rows: LamaranRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sumber, setSumber] = useState("");

  const sumberOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.sumberLowongan).filter((s): s is string => !!s)),
      ).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    const text = `${r.perusahaan} ${r.posisi}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (status && r.status !== status) return false;
    if (sumber && r.sumberLowongan !== sumber) return false;
    return true;
  });

  const thCls =
    "sticky top-0 z-10 bg-sink px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-navy-dim";

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari perusahaan / posisi…"
          className={`${fieldCls} max-w-xs`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${fieldCls} max-w-[180px]`}>
          <option value="">Semua status</option>
          {STATUS_LAMARAN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sumber} onChange={(e) => setSumber(e.target.value)} className={`${fieldCls} max-w-[180px]`}>
          <option value="">Semua sumber</option>
          {sumberOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="thin-scroll max-h-[calc(100vh-220px)] overflow-auto rounded-lg border border-line bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thCls}>Perusahaan</th>
              <th className={thCls}>Posisi</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Sumber</th>
              <th className={thCls}>Melamar</th>
              <th className={thCls}>Update</th>
              <th className={`${thCls} text-right`}>Dok</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[13px] text-navy-dim">
                  Tidak ada lamaran yang cocok.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const stale = isStale(new Date(r.updateTerakhir), r.status);
              return (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/lamaran/${r.id}`)}
                  className="cursor-pointer border-t border-line hover:bg-sink/50"
                >
                  <td className="px-3 py-2 font-semibold text-navy">{r.perusahaan}</td>
                  <td className="px-3 py-2">{r.posisi}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-navy-dim">{r.sumberLowongan ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-navy-dim">
                    {formatTanggal(r.tanggalMelamar)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 ${
                      stale ? "font-medium text-maroon" : "text-navy-dim"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {stale && (
                        <span className="h-1.5 w-1.5 rounded-full bg-maroon" aria-hidden />
                      )}
                      {formatTanggal(r.updateTerakhir)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-navy-dim">
                    {r.jumlahDokumen || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[12px] text-navy-dim">
        {filtered.length} dari {rows.length} lamaran
      </p>
    </div>
  );
}
