"use client";

import { useState } from "react";
import { deleteDokumen } from "@/app/actions/dokumen";
import { btnDanger, btnGhost } from "@/app/ui";

export function DeleteDokumen({ id, jumlahLamaran }: { id: string; jumlahLamaran: number }) {
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button type="button" onClick={() => setConfirm(true)} className={btnDanger}>
        Hapus
      </button>
    );
  }

  return (
    <form action={deleteDokumen.bind(null, id)} className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] text-navy-dim">
        Hapus dokumen ini?
        {jumlahLamaran > 0 && ` Akan dilepas dari ${jumlahLamaran} lamaran.`}
      </span>
      <button type="submit" className={btnDanger}>
        Ya, hapus
      </button>
      <button type="button" onClick={() => setConfirm(false)} className={btnGhost}>
        Batal
      </button>
    </form>
  );
}
