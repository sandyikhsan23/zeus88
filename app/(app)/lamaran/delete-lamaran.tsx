"use client";

import { useState } from "react";
import { deleteLamaran } from "@/app/actions/lamaran";
import { btnDanger, btnGhost } from "@/app/ui";

export function DeleteLamaran({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button type="button" onClick={() => setConfirm(true)} className={btnDanger}>
        Hapus
      </button>
    );
  }

  return (
    <form action={deleteLamaran.bind(null, id)} className="flex items-center gap-2">
      <span className="text-[13px] text-navy-dim">Yakin hapus lamaran ini?</span>
      <button type="submit" className={btnDanger}>
        Ya, hapus
      </button>
      <button type="button" onClick={() => setConfirm(false)} className={btnGhost}>
        Batal
      </button>
    </form>
  );
}
