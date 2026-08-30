"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
// zeus88.png, sudah di-crop rapat (buang margin kosong) → zeus88-mark.png
import logo from "@/app/logo/zeus88-mark.png";
import { fieldCls, labelCls } from "@/app/ui";
import type { AuthState } from "@/app/actions/auth";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "register";
  action: Action;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  const isRegister = mode === "register";

  return (
    <div className="min-h-screen bg-sink lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Panel brand — desktop */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-brokenwhite lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-maroon/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-maroon/15 blur-3xl"
        />
        <Image
          src={logo}
          alt="Zeus88"
          priority
          width={164}
          height={31}
          className="relative"
        />
        <div className="relative">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight">
            Lacak setiap lamaran
            <br />
            di satu tempat.
          </h2>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-brokenwhite/60">
            Status, dokumen, dan follow-up — rapi dalam satu papan kanban.
          </p>
        </div>
        <p className="relative text-[12px] text-brokenwhite/40">
          &copy; {new Date().getFullYear()} Zeus88
        </p>
      </aside>

      {/* Form */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center rounded-xl bg-sidebar px-6 py-5 lg:hidden">
            <Image src={logo} alt="Zeus88" priority width={138} height={26} />
          </div>

          <div className="rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
            <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-navy">
              <span className="h-4 w-1 rounded-full bg-maroon" aria-hidden />
              {isRegister ? "Buat akun" : "Masuk"}
            </h1>
            <p className="mb-5 mt-1 text-[13px] text-navy-dim">
              {isRegister
                ? "Daftar untuk mulai melacak lamaranmu."
                : "Masuk ke akun Zeus88 kamu."}
            </p>

            <form action={formAction} className="space-y-3.5">
              {next && <input type="hidden" name="next" value={next} />}

              {isRegister && (
                <div>
                  <label className={labelCls} htmlFor="nama">
                    Nama <span className="text-navy-dim">(opsional)</span>
                  </label>
                  <input
                    id="nama"
                    name="nama"
                    autoComplete="name"
                    className={fieldCls}
                  />
                </div>
              )}

              <div>
                <label className={labelCls} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="kamu@email.com"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? "Minimal 8 karakter" : "••••••••"}
                  className={fieldCls}
                />
              </div>

              {!isRegister && (
                <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-navy-dim">
                  <input
                    type="checkbox"
                    name="remember"
                    defaultChecked
                    className="h-3.5 w-3.5 accent-maroon"
                  />
                  Ingat saya di perangkat ini
                </label>
              )}

              {state.error && (
                <p className="rounded-md bg-status-red/10 px-2.5 py-2 text-[13px] text-status-red">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-maroon px-3 py-2 text-sm font-semibold text-white hover:bg-maroon-dim disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pending ? "Memproses…" : isRegister ? "Daftar" : "Masuk"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[13px] text-navy-dim">
            {isRegister ? (
              <>
                Sudah punya akun?{" "}
                <Link href="/login" className="font-medium text-maroon hover:underline">
                  Masuk
                </Link>
              </>
            ) : (
              <>
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-medium text-maroon hover:underline"
                >
                  Daftar
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
