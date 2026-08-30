import { createDokumen } from "@/app/actions/dokumen";
import { DokumenForm } from "../dokumen-form";
import { PageTitle, BackLink, Panel } from "@/app/ui";

export default function BaruDokumenPage() {
  return (
    <div>
      <BackLink href="/dokumen">Semua dokumen</BackLink>
      <PageTitle>Dokumen baru</PageTitle>
      <Panel className="max-w-lg p-3 lg:p-4">
        <DokumenForm action={createDokumen} />
      </Panel>
    </div>
  );
}
