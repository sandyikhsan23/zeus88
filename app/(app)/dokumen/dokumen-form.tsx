import Link from "next/link";
import { Field, fieldCls, labelCls, btnPrimary, btnGhost } from "@/app/ui";
import { KATEGORI_DOKUMEN } from "@/lib/constants";

type DokumenData = {
  id: string;
  nama: string;
  kategori: string;
  link: string | null;
  catatan: string | null;
};

export function DokumenForm({
  action,
  dokumen,
}: {
  action: (formData: FormData) => void;
  dokumen?: DokumenData;
}) {
  return (
    <form action={action} className="max-w-lg space-y-3">
      <Field label="Nama dokumen" name="nama" required defaultValue={dokumen?.nama} />
      <div>
        <label className={labelCls} htmlFor="kategori">
          Kategori
        </label>
        <select
          id="kategori"
          name="kategori"
          defaultValue={dokumen?.kategori ?? "CV/Resume"}
          className={fieldCls}
        >
          {KATEGORI_DOKUMEN.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Link (Google Drive / Dropbox / dsb)"
        name="link"
        defaultValue={dokumen?.link ?? ""}
        placeholder="https://…"
      />
      <div>
        <label className={labelCls} htmlFor="catatan">
          Catatan
        </label>
        <textarea
          id="catatan"
          name="catatan"
          rows={3}
          defaultValue={dokumen?.catatan ?? ""}
          className={fieldCls}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          {dokumen ? "Simpan perubahan" : "Tambah dokumen"}
        </button>
        <Link href={dokumen ? `/dokumen/${dokumen.id}` : "/dokumen"} className={btnGhost}>
          Batal
        </Link>
      </div>
    </form>
  );
}
