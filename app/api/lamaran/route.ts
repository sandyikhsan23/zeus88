import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/api-auth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

function clean(v: unknown, max: number): string | undefined {
  const t = String(v ?? "").trim();
  return t ? t.slice(0, max) : undefined;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return json({ error: "Sesi tidak valid — login dulu di Zeus88." }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body harus JSON." }, 400);
  }

  const perusahaan = clean(body.perusahaan, 200) ?? "(tidak diketahui)";
  const posisi = clean(body.posisi, 200) ?? "(tanpa judul)";
  const linkLowongan = clean(body.linkLowongan, 1000);

  const origin = new URL(req.url).origin;

  // Dedup: lowongan dengan link yang sama sudah tersimpan?
  if (linkLowongan) {
    const dup = await prisma.lamaran.findFirst({
      where: { userId, linkLowongan },
      select: { id: true },
    });
    if (dup) {
      return json({
        id: dup.id,
        duplicate: true,
        url: `${origin}/lamaran/${dup.id}`,
      });
    }
  }

  const now = new Date();
  const lamaran = await prisma.lamaran.create({
    data: {
      userId,
      perusahaan,
      posisi,
      linkLowongan,
      sumberLowongan: clean(body.sumberLowongan, 100),
      catatan: clean(body.catatan, 5000),
      gajiHarapan: clean(body.gajiHarapan, 200),
      status: "Belum Dikirim",
      tanggalMelamar: now,
      updateTerakhir: now,
    },
  });

  return json({ id: lamaran.id, url: `${origin}/lamaran/${lamaran.id}` }, 201);
}
