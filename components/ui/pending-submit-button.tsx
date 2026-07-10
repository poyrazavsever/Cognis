"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = ComponentProps<typeof Button> & {
  idleIcon?: ReactNode;
  pendingIcon?: ReactNode;
  pendingChildren?: ReactNode;
};

export function PendingSubmitButton({
  children,
  className,
  disabled,
  idleIcon,
  pendingChildren,
  pendingIcon,
  type = "submit",
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
      className={cn(className)}
    >
      {icon}
      {pending ? pendingChildren ?? children : children}
    </Button>
  );
}
