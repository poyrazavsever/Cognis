"use client";

import { Loader2 } from "lucide-react";
import { Button } from "poyraz-ui/atoms";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = Omit<
  ComponentProps<typeof Button>,
  "effect" | "variant"
> & {
  idleIcon?: ReactNode;
  pendingIcon?: ReactNode;
  pendingChildren?: ReactNode;
  variant?: "default" | "secondary";
};

export function PendingSubmitButton({
  children,
  className,
  disabled,
  idleIcon,
  pendingChildren,
  pendingIcon,
  type = "submit",
  variant = "default",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const icon = pending
    ? pendingIcon ?? <Loader2 className="h-4 w-4 animate-spin" />
    : idleIcon;

  return (
    <Button
      {...props}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending}
      loading={pending && !pendingIcon}
      className={cn(className)}
      variant={variant}
      effect="shine"
    >
      {icon}
      {pending ? pendingChildren ?? children : children}
    </Button>
  );
}
