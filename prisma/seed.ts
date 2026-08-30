import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const DEMO_EMAIL = "demo@zeus88.app";
const DEMO_PASSWORD = "password123";

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      nama: "Demo",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });

  const cv = await prisma.dokumen.create({
    data: {
      userId: user.id,
      nama: "CV — Umum 2026",
      kategori: "CV/Resume",
      link: "https://drive.google.com/file/d/xxxx/view",
      catatan: "Versi ATS-friendly, 1 halaman.",
    },
  });
  const porto = await prisma.dokumen.create({
    data: {
      userId: user.id,
      nama: "Portofolio Web",
      kategori: "Portofolio",
      link: "https://porto.example.com",
    },
  });
  await prisma.dokumen.create({
    data: { userId: user.id, nama: "Transkrip Nilai", kategori: "Transkrip/Ijazah" },
  });

  await prisma.lamaran.create({
    data: {
      userId: user.id,
      perusahaan: "PT Nusantara Digital",
      posisi: "Frontend Engineer",
      tanggalMelamar: daysAgo(20),
      sumberLowongan: "LinkedIn",
      status: "Menunggu Balasan",
      updateTerakhir: daysAgo(18),
      kontakHrd: "hrd@nusantara.example",
      gajiHarapan: "12–15 jt",
      catatan: "Follow up kalau belum ada kabar minggu depan.",
      dokumen: { connect: [{ id: cv.id }, { id: porto.id }] },
    },
  });

  await prisma.lamaran.create({
    data: {
      userId: user.id,
      perusahaan: "Gojek",
      posisi: "Software Engineer",
      tanggalMelamar: daysAgo(9),
      sumberLowongan: "Referral",
      status: "Interview HR",
      updateTerakhir: daysAgo(2),
      dokumen: { connect: [{ id: cv.id }] },
    },
  });

  await prisma.lamaran.create({
    data: {
      userId: user.id,
      perusahaan: "Tokopedia",
      posisi: "Frontend Engineer",
      tanggalMelamar: daysAgo(3),
      sumberLowongan: "Glints",
      status: "Belum Dikirim",
      updateTerakhir: daysAgo(3),
    },
  });

  await prisma.lamaran.create({
    data: {
      userId: user.id,
      perusahaan: "Bukalapak",
      posisi: "Web Developer",
      tanggalMelamar: daysAgo(40),
      sumberLowongan: "LinkedIn",
      status: "Ditolak",
      updateTerakhir: daysAgo(30),
    },
  });

  console.log(`\nSeed selesai. Login demo:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
