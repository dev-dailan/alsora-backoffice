import type { ButtonHTMLAttributes } from "react";
import { clsx } from "@/shared/lib/clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-dark text-white hover:opacity-90",
  secondary: "bg-white text-ink border border-brand-light/60 hover:bg-brand-lightest",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-ink hover:bg-brand-lightest",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
