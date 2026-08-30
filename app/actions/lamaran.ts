"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type LamaranInput = {
  perusahaan: string;
  posisi: string;
  tanggalMelamar: string;
  sumberLowongan?: string;
  status: string;
  kontakHrd?: string;
  linkLowongan?: string;
  gajiHarapan?: string;
  catatan?: string;
  dokumenIds: string[];
};

function parse(formData: FormData): LamaranInput {
  return {
    perusahaan: String(formData.get("perusahaan") ?? "").trim(),
    posisi: String(formData.get("posisi") ?? "").trim(),
    tanggalMelamar: String(formData.get("tanggalMelamar") ?? ""),
    sumberLowongan: str(formData.get("sumberLowongan")),
    status: String(formData.get("status") ?? "Belum Dikirim"),
    kontakHrd: str(formData.get("kontakHrd")),
    linkLowongan: str(formData.get("linkLowongan")),
    gajiHarapan: str(formData.get("gajiHarapan")),
    catatan: str(formData.get("catatan")),
    dokumenIds: formData.getAll("dokumenIds").map(String),
  };
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
}

// Ambil hanya id dokumen yang benar-benar milik user (cegah nyambungin punya orang).
async function ownedDokumenIds(userId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.dokumen.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function assertOwnsLamaran(userId: string, id: string): Promise<void> {
  const found = await prisma.lamaran.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!found) redirect("/lamaran");
}

export async function createLamaran(formData: FormData) {
  const user = await requireUser();
  const d = parse(formData);
  if (!d.perusahaan || !d.posisi)
    throw new Error("Perusahaan dan posisi wajib diisi");

  const now = new Date();
  const created = await prisma.lamaran.create({
    data: {
      userId: user.id,
      perusahaan: d.perusahaan,
      posisi: d.posisi,
      tanggalMelamar: new Date(d.tanggalMelamar || now),
      sumberLowongan: d.sumberLowongan,
      status: d.status,
      updateTerakhir: now,
      kontakHrd: d.kontakHrd,
      linkLowongan: d.linkLowongan,
      gajiHarapan: d.gajiHarapan,
      catatan: d.catatan,
      dokumen: {
        connect: (await ownedDokumenIds(user.id, d.dokumenIds)).map((id) => ({
          id,
        })),
      },
    },
  });
  revalidatePath("/");
  revalidatePath("/lamaran");
  redirect(`/lamaran/${created.id}`);
}

export async function updateLamaran(id: string, formData: FormData) {
  const user = await requireUser();
  await assertOwnsLamaran(user.id, id);
  const d = parse(formData);
  if (!d.perusahaan || !d.posisi)
    throw new Error("Perusahaan dan posisi wajib diisi");

  await prisma.lamaran.update({
    where: { id },
    data: {
      perusahaan: d.perusahaan,
      posisi: d.posisi,
      tanggalMelamar: new Date(d.tanggalMelamar),
      sumberLowongan: d.sumberLowongan,
      status: d.status,
      updateTerakhir: new Date(),
      kontakHrd: d.kontakHrd,
      linkLowongan: d.linkLowongan,
      gajiHarapan: d.gajiHarapan,
      catatan: d.catatan,
      dokumen: {
        set: (await ownedDokumenIds(user.id, d.dokumenIds)).map((docId) => ({
          id: docId,
        })),
      },
    },
  });
  revalidatePath("/");
  revalidatePath("/lamaran");
  revalidatePath(`/lamaran/${id}`);
  redirect(`/lamaran/${id}`);
}

// Dipakai oleh kanban board — hanya mengubah status + updateTerakhir.
export async function updateStatusLamaran(id: string, status: string) {
  const user = await requireUser();
  const res = await prisma.lamaran.updateMany({
    where: { id, userId: user.id },
    data: { status, updateTerakhir: new Date() },
  });
  if (res.count === 0) return;
  revalidatePath("/");
  revalidatePath("/lamaran");
}

export async function deleteLamaran(id: string) {
  const user = await requireUser();
  await prisma.lamaran.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
  revalidatePath("/lamaran");
  redirect("/lamaran");
}
