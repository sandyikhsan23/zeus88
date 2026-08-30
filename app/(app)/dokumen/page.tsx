import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageTitle, btnPrimary } from "@/app/ui";
import { DokumenGrid, type DokumenCard } from "./dokumen-grid";

export const dynamic = "force-dynamic";

export default async function DokumenListPage() {
  const user = await requireUser();
  const dokumen = await prisma.dokumen.findMany({
    where: { userId: user.id },
    orderBy: { nama: "asc" },
    include: { _count: { select: { lamaran: true } } },
  });

  const items: DokumenCard[] = dokumen.map((d) => ({
    id: d.id,
    nama: d.nama,
    kategori: d.kategori,
    link: d.link,
    catatan: d.catatan,
    jumlahLamaran: d._count.lamaran,
  }));

  return (
    <div>
      <PageTitle
        sub={`${items.length} dokumen tersimpan (link eksternal)`}
        action={
          <Link href="/dokumen/baru" className={btnPrimary}>
            + Dokumen
          </Link>
        }
      >
        Dokumen
      </PageTitle>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-navy-dim">
          Belum ada dokumen.{" "}
          <Link href="/dokumen/baru" className="font-medium text-maroon">
            Tambah yang pertama
          </Link>
          .
        </div>
      ) : (
        <DokumenGrid items={items} />
      )}
    </div>
  );
}
