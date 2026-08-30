import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createLamaran } from "@/app/actions/lamaran";
import { LamaranForm } from "../lamaran-form";
import { PageTitle, BackLink, Panel } from "@/app/ui";

export default async function BaruLamaranPage() {
  const user = await requireUser();
  const allDokumen = await prisma.dokumen.findMany({
    where: { userId: user.id },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, kategori: true },
  });

  return (
    <div>
      <BackLink href="/lamaran">Semua lamaran</BackLink>
      <PageTitle>Lamaran baru</PageTitle>
      <Panel className="max-w-2xl p-3 lg:p-4">
        <LamaranForm action={createLamaran} allDokumen={allDokumen} />
      </Panel>
    </div>
  );
}
