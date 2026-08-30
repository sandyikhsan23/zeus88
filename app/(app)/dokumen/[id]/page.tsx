import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateDokumen } from "@/app/actions/dokumen";
import { DokumenForm } from "../dokumen-form";
import { DeleteDokumen } from "../delete-dokumen";
import { PageTitle, BackLink, StatusBadge, Panel } from "@/app/ui";

export default async function DokumenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const dokumen = await prisma.dokumen.findFirst({
    where: { id, userId: user.id },
    include: { lamaran: { orderBy: { updateTerakhir: "desc" } } },
  });

  if (!dokumen) notFound();

  return (
    <div>
      <BackLink href="/dokumen">Semua dokumen</BackLink>
      <PageTitle
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-line bg-sink px-1.5 py-0.5 text-[12px] text-navy-dim">
              {dokumen.kategori}
            </span>
            <span>Dipakai di {dokumen.lamaran.length} lamaran</span>
            {dokumen.link && (
              <a
                href={dokumen.link}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-maroon hover:underline"
              >
                Buka link ↗
              </a>
            )}
          </span>
        }
        action={
          <DeleteDokumen id={dokumen.id} jumlahLamaran={dokumen.lamaran.length} />
        }
      >
        {dokumen.nama}
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel className="p-3 lg:p-4">
          <DokumenForm action={updateDokumen.bind(null, dokumen.id)} dokumen={dokumen} />
        </Panel>

        {dokumen.lamaran.length > 0 && (
          <Panel>
            <div className="border-b border-line px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-navy-dim">
              Dipakai di lamaran
            </div>
            <ul className="divide-y divide-line">
              {dokumen.lamaran.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/lamaran/${l.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-sink/50"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-semibold text-navy">{l.perusahaan}</span>
                      <span className="text-navy-dim"> · {l.posisi}</span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
