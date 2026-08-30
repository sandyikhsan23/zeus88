"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/app/logo/zeus88-mark.png";
import { logout } from "@/app/actions/auth";

const NAV = [
  { href: "/", label: "Dashboard", icon: IconGrid },
  { href: "/lamaran", label: "Lamaran", icon: IconList },
  { href: "/dokumen", label: "Dokumen", icon: IconDoc },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SideNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col bg-sidebar text-brokenwhite md:flex">
      <Link
        href="/"
        className="flex items-center justify-center border-b border-white/10 px-4 py-5"
      >
        <Image src={logo} alt="Zeus88" priority className="h-7 w-auto" />
      </Link>
      <nav className="flex flex-col gap-0.5 p-2">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${
                active
                  ? "bg-maroon font-medium text-brokenwhite"
                  : "text-brokenwhite/70 hover:bg-white/10 hover:text-brokenwhite"
              }`}
            >
              <Icon />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-2 pb-3">
        <div
          className="truncate px-2.5 pb-1 text-[11px] text-brokenwhite/45"
          title={userEmail}
        >
          {userEmail}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium text-red-400 hover:bg-red-500/15 hover:text-red-300"
          >
            <IconLogout />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}

export function TopNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-white/10 bg-sidebar px-3 py-2 text-brokenwhite md:hidden">
      <Link href="/" className="mr-2 flex items-center">
        <Image src={logo} alt="Zeus88" priority className="h-5 w-auto" />
      </Link>
      {NAV.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-2 py-1 text-[13px] ${
              active ? "bg-maroon font-medium" : "text-brokenwhite/70"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
      <form action={logout} className="ml-auto">
        <button
          type="submit"
          title={`Keluar (${userEmail})`}
          className="rounded-lg px-2 py-1 text-[13px] text-red-400 hover:text-red-300"
        >
          <IconLogout />
        </button>
      </form>
    </header>
  );
}

/* ikon garis 15px — bantu scan navigasi, monokrom, tanpa dekorasi */
function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
