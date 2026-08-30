"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/logo/zeus88-mark.png";
import { fieldCls, labelCls, btnPrimary } from "@/app/ui";
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
    <div className="flex min-h-screen items-center justify-center bg-sink px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex justify-center rounded-xl bg-sidebar px-6 py-6">
          <Image src={logo} alt="Zeus88" priority className="h-9 w-auto" />
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h1 className="text-[19px] font-semibold text-navy">
            {isRegister ? "Buat akun" : "Masuk"}
          </h1>
          <p className="mb-4 mt-0.5 text-[13px] text-navy-dim">
            {isRegister
              ? "Daftar untuk mulai melacak lamaranmu."
              : "Masuk ke akun Zeus88 kamu."}
          </p>

          <form action={formAction} className="space-y-3">
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
                className={fieldCls}
              />
              {isRegister && (
                <p className="mt-1 text-[12px] text-navy-dim">Minimal 8 karakter.</p>
              )}
            </div>

            {state.error && (
              <p className="rounded-md bg-status-red/10 px-2.5 py-1.5 text-[13px] text-status-red">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className={`${btnPrimary} w-full justify-center`}
            >
              {pending ? "Memproses…" : isRegister ? "Daftar" : "Masuk"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[13px] text-navy-dim">
          {isRegister ? (
            <>
              Sudah punya akun?{" "}
              <Link href="/login" className="font-medium text-maroon">
                Masuk
              </Link>
            </>
          ) : (
            <>
              Belum punya akun?{" "}
              <Link href="/register" className="font-medium text-maroon">
                Daftar
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
