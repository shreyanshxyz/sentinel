import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const baseClasses =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-40";

export const variantStyles: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-on-primary hover:opacity-90",
  secondary:
    "border-line-strong bg-surface text-ink-2 hover:bg-hover hover:text-ink",
  ghost:
    "border-transparent bg-transparent text-muted hover:bg-hover hover:text-ink",
  danger: "border-line-strong bg-surface text-error hover:bg-error/10",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-6 px-2 text-[11px]",
  md: "h-7 px-2.5 text-[11.5px]",
  lg: "h-8 px-3.5 text-[12.5px]",
  xl: "h-9 px-4 text-[12.5px]",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(baseClasses, variantStyles[variant], sizeStyles[size], className);
}
