import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateLamaran } from "@/app/actions/lamaran";
import { LamaranForm } from "../lamaran-form";
import { DeleteLamaran } from "../delete-lamaran";
import { PageTitle, BackLink, StatusBadge, Panel } from "@/app/ui";
import { formatTanggal, isStale, daysSince } from "@/lib/constants";

export default async function LamaranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [lamaran, allDokumen] = await Promise.all([
    prisma.lamaran.findFirst({
      where: { id, userId: user.id },
      include: { dokumen: true },
    }),
    prisma.dokumen.findMany({
      where: { userId: user.id },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, kategori: true },
    }),
  ]);

  if (!lamaran) notFound();

  const stale = isStale(lamaran.updateTerakhir, lamaran.status);

  return (
    <div>
      <BackLink href="/lamaran">Semua lamaran</BackLink>
      <PageTitle sub={lamaran.posisi} action={<DeleteLamaran id={lamaran.id} />}>
        {lamaran.perusahaan}
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel className="order-2 p-3 lg:order-1 lg:p-4">
          <LamaranForm
            action={updateLamaran.bind(null, lamaran.id)}
            lamaran={lamaran}
            allDokumen={allDokumen}
          />
        </Panel>

        <div className="order-1 space-y-3 lg:order-2">
          <Panel className="divide-y divide-line text-sm">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[12px] text-navy-dim">Status</span>
              <StatusBadge status={lamaran.status} />
            </div>
            <Info label="Melamar" value={formatTanggal(lamaran.tanggalMelamar)} />
            <div className="px-3 py-2">
              <div className="text-[12px] text-navy-dim">Update terakhir</div>
              <div className={stale ? "font-medium text-maroon" : ""}>
                {formatTanggal(lamaran.updateTerakhir)}
                {stale && (
                  <span className="ml-1 text-[12px]">
                    · {daysSince(lamaran.updateTerakhir)} hari lalu
                  </span>
                )}
              </div>
            </div>
            {lamaran.sumberLowongan && (
              <Info label="Sumber" value={lamaran.sumberLowongan} />
            )}
            {lamaran.gajiHarapan && (
              <Info label="Gaji harapan" value={lamaran.gajiHarapan} />
            )}
            {lamaran.kontakHrd && <Info label="Kontak HRD" value={lamaran.kontakHrd} />}
            {lamaran.linkLowongan && (
              <a
                href={lamaran.linkLowongan}
                target="_blank"
                rel="noreferrer"
                className="block px-3 py-2 font-medium text-maroon hover:underline"
              >
                Buka lowongan ↗
              </a>
            )}
          </Panel>

          {lamaran.dokumen.length > 0 && (
            <Panel>
              <div className="border-b border-line px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-navy-dim">
                Dokumen terlampir ({lamaran.dokumen.length})
              </div>
              <ul className="divide-y divide-line">
                {lamaran.dokumen.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <Link href={`/dokumen/${d.id}`} className="hover:text-maroon">
                      {d.nama}
                      <span className="text-[12px] text-navy-dim"> · {d.kategori}</span>
                    </Link>
                    {d.link && (
                      <a
                        href={d.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-maroon"
                      >
                        ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-[12px] text-navy-dim">{label}</span>
      <span className="truncate text-right">{value}</span>
    </div>
  );
}
