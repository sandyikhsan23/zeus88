# Zeus88 — Extension "Simpan Lowongan"

Simpan lowongan yang sedang kamu buka (LinkedIn, Glints, Jobstreet, Kalibrr,
career page perusahaan, dll) langsung ke Zeus88 dengan satu klik.

Bukan scraper — extension ini membaca halaman yang **kamu** buka di browser
(data terstruktur `JobPosting` schema.org, atau meta tag), lalu mengirimnya ke
akun Zeus88 kamu lewat sesi login yang sudah ada.

## Pasang (Chrome / Edge / Brave)

1. Buka `chrome://extensions`
2. Nyalakan **Developer mode** (pojok kanan atas)
3. **Load unpacked** → pilih folder `extension/` ini
4. Klik ikon extension → **Atur URL Zeus88** → isi URL app kamu
   (mis. `https://zeus88-xxxx.vercel.app`) → Simpan
5. Pastikan kamu sudah **login** di URL tersebut di browser yang sama

## Pakai

1. Buka halaman detail sebuah lowongan
2. Klik ikon Zeus88 di toolbar
3. Cek preview (posisi, perusahaan, sumber) → **Simpan ke Zeus88**
4. Lowongan masuk sebagai Lamaran berstatus **"Belum Dikirim"**, dengan
   link + catatan (lokasi, tipe, gaji jika ada) terisi otomatis

Klik lagi di halaman yang sama → tidak akan dobel (dedup berdasarkan link).

## Cara kerja / auth

- Extension baca cookie sesi `zeus88_session` untuk domain Zeus88 kamu
  (butuh permission `cookies` + `host_permissions`), lalu kirim sebagai
  `Authorization: Bearer …` ke `POST /api/lamaran`.
- Kalau sesi habis (30 hari) atau kamu logout, tinggal login lagi di web.
- Tidak ada token yang perlu di-copy-paste.

## Batasan

- Situs tanpa data `JobPosting` terstruktur → jatuh ke judul/deskripsi dari
  meta tag (kadang kurang rapi, tinggal edit di Zeus88).
- Halaman yang butuh scroll/klik dulu untuk memunculkan detail: buka detail
  lowongannya dulu baru klik extension.
