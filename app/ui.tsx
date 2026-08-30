import Link from "next/link";
import { toneOf, TONE_PILL } from "@/lib/constants";

export const fieldCls =
  "w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/30";
export const labelCls = "block text-[13px] text-navy-dim mb-1";

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-maroon px-3 py-1.5 text-sm font-medium text-brokenwhite hover:bg-maroon-dim disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy hover:border-navy-dim";
export const btnDanger =
  "inline-flex items-center gap-1.5 rounded-lg border border-status-red px-3 py-1.5 text-sm font-medium text-status-red hover:bg-status-red hover:text-brokenwhite";

export function PageTitle({
  children,
  action,
  sub,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-[22px] font-semibold leading-tight tracking-tight text-navy">
          <span className="h-4 w-1 shrink-0 rounded-full bg-maroon" aria-hidden />
          {children}
        </h1>
        {sub && <p className="mt-1 text-[13px] text-navy-dim">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-white ${className}`}>{children}</div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] font-medium ${
        TONE_PILL[toneOf(status)]
      }`}
    >
      {status}
    </span>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={name}>
        {label}
        {required && <span className="text-maroon"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={fieldCls}
      />
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex items-center text-[13px] text-navy-dim hover:text-maroon"
    >
      &larr;&nbsp;{children}
    </Link>
  );
}
