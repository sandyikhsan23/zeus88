import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { KanbanBoard, type KanbanCard } from "@/app/kanban-board";
import { PageTitle, btnPrimary } from "@/app/ui";
import {
  STATUS_LAMARAN,
  STATUS_FINAL,
  isStale,
  toneOf,
  TONE_DOT,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const lamaran = await prisma.lamaran.findMany({
    where: { userId: user.id },
    orderBy: { updateTerakhir: "desc" },
  });

  const total = lamaran.length;
  const aktif = lamaran.filter(
    (l) => !STATUS_FINAL.includes(l.status as (typeof STATUS_FINAL)[number]),
  ).length;
  const basi = lamaran.filter((l) => isStale(l.updateTerakhir, l.status)).length;
  const diterima = lamaran.filter((l) => l.status === "Diterima").length;

  const perStatus = STATUS_LAMARAN.map((s) => ({
    status: s,
    count: lamaran.filter((l) => l.status === s).length,
  }));

  const cards: KanbanCard[] = lamaran.map((l) => ({
    id: l.id,
    perusahaan: l.perusahaan,
    posisi: l.posisi,
    status: l.status,
    updateTerakhir: l.updateTerakhir.toISOString(),
    stale: isStale(l.updateTerakhir, l.status),
  }));

  return (
    <div>
      <PageTitle
        sub="Ringkasan + papan status. Tarik kartu antar kolom untuk mengubah status."
        action={
          <Link href="/lamaran/baru" className={btnPrimary}>
            + Lamaran
          </Link>
        }
      >
        Dashboard
      </PageTitle>

      {/* Stat tiles */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Total lamaran" value={total} accent />
        <StatTile label="Masih aktif" value={aktif} />
        <StatTile label="Perlu di-follow up" value={basi} warn={basi > 0} />
        <StatTile label="Diterima" value={diterima} />
      </div>

      {/* Legenda + hitung per status (senada dengan kolom kanban di bawah) */}
      {total > 0 && (
        <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-line bg-white px-3 py-2.5">
          {perStatus.map((p) => (
            <span
              key={p.status}
              className={`flex items-center gap-1.5 text-[12px] ${
                p.count === 0 ? "opacity-40" : ""
              }`}
            >
              <span
                className={`h-2 w-2 rounded-sm ${TONE_DOT[toneOf(p.status)]}`}
                aria-hidden
              />
              <span className="text-navy-dim">{p.status}</span>
              <span className="font-semibold text-navy">{p.count}</span>
            </span>
          ))}
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center">
          <p className="text-sm text-navy-dim">
            Belum ada lamaran.{" "}
            <Link href="/lamaran/baru" className="font-medium text-maroon">
              Tambah yang pertama
            </Link>
            .
          </p>
        </div>
      ) : (
        <KanbanBoard initial={cards} />
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-white px-3 py-2.5 ${
        accent ? "border-maroon" : "border-line"
      }`}
    >
      <div
        className={`text-2xl font-bold leading-none ${
          accent || warn ? "text-maroon" : "text-navy"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] text-navy-dim">{label}</div>
    </div>
  );
}
