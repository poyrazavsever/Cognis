"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn("text-sm font-medium leading-none text-foreground", className)}
      {...props}
    />
  );
}

type FieldProps = ComponentPropsWithoutRef<"div"> & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
};

export function Field({
  label,
  description,
  error,
  htmlFor,
  children,
  className,
  ...props
}: FieldProps) {
  const descriptionId = htmlFor && description ? `${htmlFor}-description` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

