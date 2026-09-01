# Zeus88

Web untuk melacak lamaran pekerjaan dan menyimpan link dokumen lamaran
(CV, portofolio, sertifikat, dll). **Multi-user** — tiap orang punya akun & datanya sendiri.

Spesifikasi awal: [`zeus88-spec.md`](./zeus88-spec.md).

## Tech stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4 — token warna & font di `app/globals.css` (v4 CSS-first, tanpa `tailwind.config.ts`).
  Palet: base putih, aksen hijau (`--color-maroon*`, nama token historis), taskbar navy muda (`--color-sidebar`).
- **PostgreSQL** via Prisma 6
- Auth email + password sendiri: `bcryptjs` (hash) + `jose` (session JWT di cookie httpOnly).
  Tidak pakai library auth eksternal.
- `@dnd-kit/core` untuk kanban drag & drop
- Server Actions untuk semua mutasi (tidak ada API route)

## Setup lokal

Butuh database PostgreSQL. Paling cepat: buat gratis di [Neon](https://neon.tech) atau
[Supabase](https://supabase.com), salin connection string.

```bash
cp .env.example .env      # lalu isi DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm install               # + prisma generate (postinstall)
npx prisma migrate dev --name init   # buat tabel
npm run db:seed           # opsional — user demo: demo@zeus88.app / password123
npm run dev               # http://localhost:3000
```

Generate `AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

> Mau dev tanpa Postgres? Di `prisma/schema.prisma` ganti `provider` ke `"sqlite"`,
> hapus baris `directUrl`, set `DATABASE_URL="file:./dev.db"`, lalu `npx prisma migrate dev`.

Script: `npm run build`, `db:studio`, `db:migrate`, `db:deploy` (migrate saat produksi), `db:seed`.

## Deploy

1. Buat database Postgres (Neon/Supabase/Vercel Postgres/RDS…).
2. Set environment variable di host:
   - `DATABASE_URL` — koneksi pooled
   - `DIRECT_URL` — koneksi direct/unpooled (untuk migrate). Kalau tak ada pooler, samakan dengan `DATABASE_URL`.
   - `AUTH_SECRET` — string acak 32+ byte. **Jangan** ganti-ganti setelah live (semua sesi jadi logout).
3. Build command: `npm run build` (otomatis `prisma generate` via postinstall).
4. Jalankan migrasi ke DB produksi: `npm run db:deploy` (`prisma migrate deploy`) —
   sekali di awal & tiap ada perubahan schema. Bisa lewat CI atau `prisma migrate deploy` manual.
5. Deploy. Cocok untuk Vercel/Netlify/Railway/Fly/Render (serverless aman karena Postgres, bukan SQLite).

Catatan: jika di depan reverse proxy dengan domain berbeda, set
`serverActions.allowedOrigins` di `next.config.ts`.

## Browser extension — "Simpan Lowongan"

`extension/` — extension Chrome/Edge (Manifest V3) untuk menyimpan lowongan yang
sedang dibuka ke Zeus88 dengan satu klik. Baca `JobPosting` schema.org di halaman,
kirim ke `POST /api/lamaran` pakai sesi login yang sudah ada (cookie `zeus88_session`
dibaca via `chrome.cookies`, dikirim sebagai `Authorization: Bearer`). Setup di
`extension/README.md`.

`POST /api/lamaran` menerima `{ perusahaan, posisi, linkLowongan, catatan, sumberLowongan, gajiHarapan }`,
membuat Lamaran berstatus "Belum Dikirim", dedup berdasarkan `linkLowongan`.

## Auth — cara kerja

- `lib/session.ts` — sign/verify JWT (edge-safe, dipakai `proxy.ts` + `lib/auth.ts`).
- `lib/auth.ts` — hash/verify password, set/hapus cookie sesi, `requireUser()` (dipakai di
  tiap Server Component & Server Action yang butuh login).
- `proxy.ts` (Next 16 middleware) — redirect belum-login → `/login?next=…`, sudah-login → `/`
  kalau buka `/login`/`/register`.
- `app/(app)/layout.tsx` — route group berisi seluruh halaman aplikasi, dijaga `requireUser()`
  + render sidebar. Login/register (`app/login`, `app/register`) di luar group ini, tanpa chrome.
- Setiap query & action di-scope `where: { userId }`; akses record milik user lain → 404.
- Hapus user → data (Lamaran/Dokumen) ikut terhapus (`onDelete: Cascade`).

## Struktur

```
proxy.ts                     middleware auth (Next 16)
app/
  layout.tsx                 root — <html>/<body> + font saja
  globals.css                token warna & tipografi
  ui.tsx                     komponen kecil bersama (Field, Panel, StatusBadge, tombol, PageTitle)
  nav.tsx                    SideNav + TopNav (client) — logo, nav aktif, email + Keluar
  kanban-board.tsx           board client, drag & drop → updateStatusLamaran
  auth-form.tsx              form login/register (client, useActionState)
  login/ , register/         halaman auth (di luar route group (app))
  actions/
    auth.ts                  register / login / logout
    lamaran.ts               create / update / updateStatus / delete  (scoped userId)
    dokumen.ts               create / update / delete                 (scoped userId)
  (app)/                     route group — semua halaman butuh login
    layout.tsx               requireUser() + sidebar chrome
    page.tsx                 Dashboard: stat + kanban
    lamaran/…                tabel, form baru/edit, detail, hapus
    dokumen/…                grid, form baru/edit, detail, hapus
lib/
  prisma.ts                  singleton PrismaClient
  session.ts                 JWT sesi (edge-safe)
  auth.ts                    password + sesi + requireUser()
  constants.ts               status, kategori, tone warna, helper tanggal
prisma/
  schema.prisma              User, Lamaran, Dokumen (Lamaran/Dokumen punya userId)
  seed.ts                    user demo + data contoh
```
