import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Montserrat = variable font open-source dari Google, jadi boleh via next/font
// (larangan di spec khusus Helvetica yang berbayar).
const montserrat = Montserrat({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zeus88",
  description: "Pelacak lamaran pekerjaan & dokumen lamaran",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
