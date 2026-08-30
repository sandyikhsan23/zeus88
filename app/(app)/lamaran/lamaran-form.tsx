import { Field, fieldCls, labelCls, btnPrimary, btnGhost } from "@/app/ui";
import { STATUS_LAMARAN } from "@/lib/constants";
import Link from "next/link";

type LamaranData = {
  id: string;
  perusahaan: string;
  posisi: string;
  tanggalMelamar: Date;
  sumberLowongan: string | null;
  status: string;
  kontakHrd: string | null;
  linkLowongan: string | null;
  gajiHarapan: string | null;
  catatan: string | null;
  dokumen: { id: string }[];
};

function toDateInput(d: Date): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate(),
  ).padStart(2, "0")}`;
}

export function LamaranForm({
  action,
  lamaran,
  allDokumen,
}: {
  action: (formData: FormData) => void;
  lamaran?: LamaranData;
  allDokumen: { id: string; nama: string; kategori: string }[];
}) {
  const selected = new Set(lamaran?.dokumen.map((d) => d.id) ?? []);
  return (
    <form action={action} className="max-w-2xl space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Perusahaan" name="perusahaan" required defaultValue={lamaran?.perusahaan} />
        <Field label="Posisi" name="posisi" required defaultValue={lamaran?.posisi} />
        <Field
          label="Tanggal melamar"
          name="tanggalMelamar"
          type="date"
          required
          defaultValue={lamaran ? toDateInput(lamaran.tanggalMelamar) : toDateInput(new Date())}
        />
        <div>
          <label className={labelCls} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={lamaran?.status ?? "Belum Dikirim"}
            className={fieldCls}
          >
            {STATUS_LAMARAN.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Sumber lowongan"
          name="sumberLowongan"
          defaultValue={lamaran?.sumberLowongan ?? ""}
          placeholder="LinkedIn, Glints, referral…"
        />
        <Field
          label="Kontak HRD"
          name="kontakHrd"
          defaultValue={lamaran?.kontakHrd ?? ""}
          placeholder="Nama / email / no. HP"
        />
        <Field
          label="Link lowongan"
          name="linkLowongan"
          defaultValue={lamaran?.linkLowongan ?? ""}
          placeholder="https://…"
        />
        <Field
          label="Gaji harapan"
          name="gajiHarapan"
          defaultValue={lamaran?.gajiHarapan ?? ""}
          placeholder="mis. 8–10 jt"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="catatan">
          Catatan
        </label>
        <textarea
          id="catatan"
          name="catatan"
          rows={3}
          defaultValue={lamaran?.catatan ?? ""}
          className={fieldCls}
        />
      </div>

      <div>
        <span className={labelCls}>Dokumen dilampirkan</span>
        {allDokumen.length === 0 ? (
          <p className="text-[13px] text-navy-dim">
            Belum ada dokumen. <Link href="/dokumen/baru" className="text-maroon">Tambah dokumen</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-1 rounded-lg border border-line bg-white px-2.5 py-2 sm:grid-cols-2">
            {allDokumen.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="dokumenIds"
                  value={d.id}
                  defaultChecked={selected.has(d.id)}
                  className="accent-maroon"
                />
                <span>
                  {d.nama} <span className="text-[12px] text-navy-dim">· {d.kategori}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          {lamaran ? "Simpan perubahan" : "Tambah lamaran"}
        </button>
        <Link href={lamaran ? `/lamaran/${lamaran.id}` : "/lamaran"} className={btnGhost}>
          Batal
        </Link>
      </div>
    </form>
  );
}
