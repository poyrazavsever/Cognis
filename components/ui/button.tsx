"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:bg-primary-pressed",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground hover:bg-accent active:bg-accent-hover",
  outline:
    "border-border-strong bg-surface text-foreground shadow-sm hover:bg-accent active:bg-accent-hover",
  ghost:
    "border-transparent bg-transparent text-foreground hover:bg-accent active:bg-accent-hover",
  danger:
    "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive-hover active:bg-destructive-pressed",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2.5 px-5 text-sm",
  icon: "h-9 w-9 p-0",
  "icon-sm": "h-8 w-8 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export type IconButtonProps = Omit<ButtonProps, "children" | "size"> & {
  label: string;
  tooltip?: string;
  children: ReactNode;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, tooltip, children, className, ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      aria-label={label}
      title={tooltip ?? label}
      className={className}
      {...props}
    >
      {children}
    </Button>
  ),
);

IconButton.displayName = "IconButton";
