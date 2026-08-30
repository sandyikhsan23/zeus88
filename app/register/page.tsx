import type { Metadata } from "next";
import { register } from "@/app/actions/auth";
import { AuthForm } from "@/app/auth-form";

export const metadata: Metadata = { title: "Daftar · Zeus88" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="register" action={register} next={next} />;
}
