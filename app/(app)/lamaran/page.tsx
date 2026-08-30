import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageTitle, btnPrimary } from "@/app/ui";
import { LamaranTable, type LamaranRow } from "./lamaran-table";

export const dynamic = "force-dynamic";

export default async function LamaranListPage() {
  const user = await requireUser();
  const lamaran = await prisma.lamaran.findMany({
    where: { userId: user.id },
    orderBy: { updateTerakhir: "desc" },
    include: { _count: { select: { dokumen: true } } },
  });

  const rows: LamaranRow[] = lamaran.map((l) => ({
    id: l.id,
    perusahaan: l.perusahaan,
    posisi: l.posisi,
    status: l.status,
    sumberLowongan: l.sumberLowongan,
    tanggalMelamar: l.tanggalMelamar.toISOString(),
    updateTerakhir: l.updateTerakhir.toISOString(),
    jumlahDokumen: l._count.dokumen,
  }));

  return (
    <div>
      <PageTitle
        sub={`${rows.length} lamaran tercatat`}
        action={
          <Link href="/lamaran/baru" className={btnPrimary}>
            + Lamaran
          </Link>
        }
      >
        Lamaran
      </PageTitle>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-navy-dim">
          Belum ada lamaran.{" "}
          <Link href="/lamaran/baru" className="font-medium text-maroon">
            Tambah yang pertama
          </Link>
          .
        </div>
      ) : (
        <LamaranTable rows={rows} />
      )}
    </div>
  );
}
