"use client";

import { useFormStatus } from "react-dom";
import { Button } from "poyraz-ui/atoms";
import React from "react";

interface SubmitButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "effect" | "variant"> {
  pendingText?: string;
  variant?: "default" | "secondary";
}

export function SubmitButton({
  children,
  pendingText,
  type = "submit",
  variant = "default",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={type}
      disabled={pending}
      loading={pending}
      aria-busy={pending}
      {...props}
      variant={variant}
      effect="shine"
    >
      {pending ? (
        <>
          {pendingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
