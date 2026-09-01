"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
}

type DokumenInput = {
  nama: string;
  kategori: string;
  link?: string;
  catatan?: string;
};

function parse(formData: FormData): DokumenInput {
  return {
    nama: String(formData.get("nama") ?? "").trim(),
    kategori: String(formData.get("kategori") ?? "Lainnya"),
    link: str(formData.get("link")),
    catatan: str(formData.get("catatan")),
  };
}

async function assertOwnsDokumen(userId: string, id: string): Promise<void> {
  const found = await prisma.dokumen.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!found) redirect("/dokumen");
}

export async function createDokumen(formData: FormData) {
  const user = await requireUser();
  const d = parse(formData);
  if (!d.nama) throw new Error("Nama dokumen wajib diisi");
  const created = await prisma.dokumen.create({
    data: { ...d, userId: user.id },
  });
  revalidatePath("/dokumen");
  redirect(`/dokumen/${created.id}?saved=baru`);
}

export async function updateDokumen(id: string, formData: FormData) {
  const user = await requireUser();
  await assertOwnsDokumen(user.id, id);
  const d = parse(formData);
  if (!d.nama) throw new Error("Nama dokumen wajib diisi");
  await prisma.dokumen.update({ where: { id }, data: d });
  revalidatePath("/dokumen");
  revalidatePath(`/dokumen/${id}`);
  redirect(`/dokumen/${id}?saved=update`);
}

export async function deleteDokumen(id: string) {
  const user = await requireUser();
  await assertOwnsDokumen(user.id, id);
  // Lepas dulu semua relasi ke lamaran, baru hapus.
  await prisma.dokumen.update({
    where: { id },
    data: { lamaran: { set: [] } },
  });
  await prisma.dokumen.delete({ where: { id } });
  revalidatePath("/dokumen");
  revalidatePath("/lamaran");
  redirect("/dokumen?saved=hapus");
}
