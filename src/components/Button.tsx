import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[var(--shadow-glow)] active:brightness-95",
  secondary: "bg-secondary text-secondary-foreground border border-border active:brightness-110",
  ghost: "bg-transparent text-foreground border border-border active:bg-secondary",
  danger: "bg-destructive text-destructive-foreground active:brightness-95",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "display flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xl uppercase tracking-wider transition disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
