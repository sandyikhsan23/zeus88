# Zeus88 — Spesifikasi Proyek

Website pribadi untuk melacak lamaran pekerjaan dan menyimpan dokumen kebutuhan melamar (CV, portofolio, sertifikat, dll).

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database:** SQLite via Prisma (single-user, lokal, tidak perlu setup server terpisah)
- **Font:** Helvetica Neue (system font, gaya iOS) — lihat bagian Typography di bawah

## Color Palette

| Nama | Hex | Pemakaian |
|---|---|---|
| Broken White | `#F2EFE9` | Background utama (light mode) |
| Navy | `#121F3A` | Teks utama, header, elemen gelap |
| Navy Dim | `#3A4A6B` | Teks sekunder, border |
| Maroon | `#7A1F2B` | Aksen utama, tombol primer, highlight |
| Maroon Dim | `#B85C64` | Hover state, aksen sekunder |
| Line | `#DDD7CC` | Border/divider di atas broken white |

Status badge tetap pakai warna semantik terpisah (biru/kuning/hijau/merah standar) supaya tidak bentrok dengan maroon aksen, tapi disaturasi rendah biar tetap senada dengan palet utama.

## Typography

Pakai Helvetica Neue lewat font stack sistem (bukan `next/font/google`, karena Helvetica bukan web font gratis) — ini juga yang bikin tampilannya terasa native seperti iOS:

```css
font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
```

Set di `tailwind.config.ts` sebagai `fontFamily.sans` default, jadi berlaku ke semua elemen tanpa perlu class tambahan per komponen.

Aturan bold, mengikuti konvensi iOS (bold dipakai secukupnya untuk hierarki, bukan dekorasi):

| Elemen | Weight |
|---|---|
| Judul halaman (mis. "Lamaran", "Dokumen") | 600 (Semibold) |
| Nama perusahaan di kartu/tabel | 600 (Semibold) |
| Angka statistik (stat rail) | 700 (Bold) |
| Posisi, label field, teks tabel | 400 (Regular) |
| Teks sekunder (tanggal, catatan, placeholder) | 400 (Regular), warna navy-dim |
| Tombol | 500 (Medium) |

Ukuran dasar 14px (`text-sm`) untuk body, 13px untuk metadata/label, 20–22px untuk judul halaman. Hindari ukuran besar (28px+) — ini tools fungsional, bukan halaman marketing.

## Struktur Halaman (App Router)

```
/                      → Dashboard (stat ringkasan + kanban board)
/lamaran               → Tabel semua lamaran (sortable, filterable)
/lamaran/[id]          → Detail + edit satu lamaran
/lamaran/baru          → Form tambah lamaran
/dokumen               → Grid dokumen tersimpan
/dokumen/[id]          → Detail + edit satu dokumen
```

## Data Model (Prisma schema)

```prisma
model Lamaran {
  id            String   @id @default(cuid())
  perusahaan    String
  posisi        String
  tanggalMelamar DateTime
  sumberLowongan String?
  status        String   // lihat daftar status di bawah
  updateTerakhir DateTime
  kontakHrd     String?
  linkLowongan  String?
  gajiHarapan   String?
  catatan       String?
  dokumen       Dokumen[] @relation("LamaranDokumen")
  createdAt     DateTime @default(now())
}

model Dokumen {
  id        String    @id @default(cuid())
  nama      String
  kategori  String    // CV/Resume, Surat Lamaran, Portofolio, Sertifikat, Transkrip/Ijazah, KTP/Identitas, Lainnya
  link      String?   // URL ke Google Drive/Dropbox, dsb — bukan upload file
  catatan   String?
  lamaran   Lamaran[] @relation("LamaranDokumen")
  createdAt DateTime  @default(now())
}
```

> Catatan: dokumen disimpan sebagai **link eksternal** (Google Drive/Dropbox/dsb), bukan file upload. Kalau nanti butuh upload file asli, tambahkan storage terpisah (misal Vercel Blob atau S3) — di luar scope versi awal ini.

### Daftar Status Lamaran
`Belum Dikirim`, `Sudah Melamar`, `Menunggu Balasan`, `Interview HR`, `Interview User`, `Tes/Assessment`, `Offering`, `Diterima`, `Ditolak`, `Mengundurkan Diri`

## Fitur

### Dashboard (`/`)
- Stat rail: total lamaran + jumlah per status
- Kanban board per status, drag & drop untuk update status (server action)
- Highlight kartu yang belum di-update >10 hari dan statusnya belum final

### Daftar Lamaran (`/lamaran`)
- Tabel dengan search (nama perusahaan/posisi), filter status, filter sumber lowongan
- Klik baris → ke halaman detail

### Form Lamaran (`/lamaran/baru`, `/lamaran/[id]`)
- Semua field sesuai data model
- Multi-select dokumen untuk dilampirkan ke lamaran ini
- Tombol hapus di halaman edit

### Dokumen (`/dokumen`)
- Grid kartu dokumen: nama, kategori, catatan, link, jumlah lamaran yang memakainya
- Search + filter kategori
- Tambah/edit/hapus dokumen; hapus dokumen otomatis melepas relasi ke lamaran

## Desain / UI

- **Minimalis, fokus fungsi** — tidak ada dekorasi, ilustrasi, atau elemen yang tidak membawa informasi. Setiap elemen visual (garis, warna, bold) harus punya alasan fungsional.
- Layout bersih, rata kiri, garis pembatas tipis (bukan kartu bulat dengan shadow tebal ala SaaS template)
- Aksen maroon dipakai sekali sebagai warna signature (tombol utama, garis status aktif, angka statistik total) — jangan disebar ke semua elemen
- Dark-on-light: teks navy di atas broken white, bukan hitam pekat
- Responsive sampai mobile; kanban board scroll horizontal di layar kecil

### Spacing — padat, tidak boros tempat

Target: kepadatan informasi tinggi, mirip aplikasi produktivitas native, bukan landing page lega.

| Konteks | Ukuran |
|---|---|
| Padding dalam card/row | `px-3 py-2` (12px / 8px) — bukan `p-6` |
| Jarak antar field form | `space-y-3` (12px) — bukan `space-y-6` |
| Padding halaman (container) | `px-4 py-4` di mobile, `px-6 py-5` di desktop |
| Row height tabel | Compact, cukup untuk 1 baris teks + sedikit napas, bukan `py-4` |
| Gap antar kartu kanban | `gap-2` sampai `gap-3` (8–12px) |
| Line-height body text | 1.4, bukan 1.6+ |

Hindari `space-y-8`, `gap-6`+, `p-8`+ di elemen berulang (card, row, list item). Whitespace besar hanya boleh dipakai sesekali untuk memisahkan section besar (mis. antara stat rail dan board), bukan di setiap elemen kecil.

## Setup Instructions (untuk Claude Code)

1. `npx create-next-app@latest zeus88 --typescript --tailwind --app`
2. Install Prisma: `npm install prisma @prisma/client` → `npx prisma init --datasource-provider sqlite`
3. Tempel schema di atas ke `prisma/schema.prisma`, lalu `npx prisma migrate dev --name init`
4. Set `fontFamily.sans` di `tailwind.config.ts` ke system font stack (`-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`) — tidak perlu `next/font/google`
5. Tambahkan warna di `tailwind.config.ts` sebagai custom theme colors (`brokenwhite`, `navy`, `navy-dim`, `maroon`, `maroon-dim`, `line`)
6. Bangun halaman sesuai struktur route di atas, gunakan Server Actions untuk create/update/delete
