-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lamaran" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "perusahaan" TEXT NOT NULL,
    "posisi" TEXT NOT NULL,
    "tanggalMelamar" TIMESTAMP(3) NOT NULL,
    "sumberLowongan" TEXT,
    "status" TEXT NOT NULL,
    "updateTerakhir" TIMESTAMP(3) NOT NULL,
    "kontakHrd" TEXT,
    "linkLowongan" TEXT,
    "gajiHarapan" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lamaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dokumen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "link" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_LamaranDokumen" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LamaranDokumen_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Lamaran_userId_idx" ON "public"."Lamaran"("userId");

-- CreateIndex
CREATE INDEX "Dokumen_userId_idx" ON "public"."Dokumen"("userId");

-- CreateIndex
CREATE INDEX "_LamaranDokumen_B_index" ON "public"."_LamaranDokumen"("B");

-- AddForeignKey
ALTER TABLE "public"."Lamaran" ADD CONSTRAINT "Lamaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dokumen" ADD CONSTRAINT "Dokumen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LamaranDokumen" ADD CONSTRAINT "_LamaranDokumen_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Dokumen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LamaranDokumen" ADD CONSTRAINT "_LamaranDokumen_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Lamaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
