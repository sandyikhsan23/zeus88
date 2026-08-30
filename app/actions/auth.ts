"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";

export type AuthState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(next: FormDataEntryValue | null): string {
  const s = String(next ?? "");
  // hanya izinkan path internal (cegah open redirect)
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nama = String(formData.get("nama") ?? "").trim() || null;
  const next = safeNext(formData.get("next"));

  if (!EMAIL_RE.test(email)) return { error: "Email tidak valid." };
  if (password.length < 8)
    return { error: "Password minimal 8 karakter." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email ini sudah terdaftar." };

  const user = await prisma.user.create({
    data: { email, nama, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect(next);
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email atau password salah." };
  }
  await createSession(user.id);
  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
