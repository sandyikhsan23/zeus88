export const STATUS_LAMARAN = [
  "Belum Dikirim",
  "Sudah Melamar",
  "Menunggu Balasan",
  "Interview HR",
  "Interview User",
  "Tes/Assessment",
  "Offering",
  "Diterima",
  "Ditolak",
  "Mengundurkan Diri",
] as const;

export type StatusLamaran = (typeof STATUS_LAMARAN)[number];

// Status "final" — tidak perlu di-follow-up lagi, jadi tidak di-highlight sebagai basi.
export const STATUS_FINAL: StatusLamaran[] = [
  "Diterima",
  "Ditolak",
  "Mengundurkan Diri",
];

export const KATEGORI_DOKUMEN = [
  "CV/Resume",
  "Surat Lamaran",
  "Portofolio",
  "Sertifikat",
  "Transkrip/Ijazah",
  "KTP/Identitas",
  "Lainnya",
] as const;

export type KategoriDokumen = (typeof KATEGORI_DOKUMEN)[number];

// Tone semantik per status (low-saturation, senada palet — lihat token status-* di globals.css).
type Tone = "slate" | "blue" | "amber" | "green" | "red";

export const STATUS_TONE: Record<string, Tone> = {
  "Belum Dikirim": "slate",
  "Sudah Melamar": "blue",
  "Menunggu Balasan": "amber",
  "Interview HR": "blue",
  "Interview User": "blue",
  "Tes/Assessment": "amber",
  Offering: "green",
  Diterima: "green",
  Ditolak: "red",
  "Mengundurkan Diri": "slate",
};

// kelas untuk titik warna solid (dot)
export const TONE_DOT: Record<Tone, string> = {
  slate: "bg-status-slate",
  blue: "bg-status-blue",
  amber: "bg-status-amber",
  green: "bg-status-green",
  red: "bg-status-red",
};

// kelas untuk pill bertint (bg lembut + teks berwarna)
export const TONE_PILL: Record<Tone, string> = {
  slate: "bg-status-slate/10 text-status-slate",
  blue: "bg-status-blue/10 text-status-blue",
  amber: "bg-status-amber/15 text-status-amber",
  green: "bg-status-green/12 text-status-green",
  red: "bg-status-red/10 text-status-red",
};

export function toneOf(status: string): Tone {
  return STATUS_TONE[status] ?? "slate";
}

export const STALE_DAYS = 10;

export function isStale(updateTerakhir: Date, status: string): boolean {
  if (STATUS_FINAL.includes(status as StatusLamaran)) return false;
  return daysSince(updateTerakhir) > STALE_DAYS;
}

export function daysSince(d: Date | string): number {
  const ms = Date.now() - new Date(d).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function formatTanggal(d: Date | string): string {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
