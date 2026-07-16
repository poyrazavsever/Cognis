"use client";

import { useFormStatus } from "react-dom";
import { Button } from "poyraz-ui/atoms";
import React from "react";

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  pendingText?: string;
}

export function SubmitButton({
  children,
  pendingText,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type={type} disabled={pending} loading={pending} aria-busy={pending} {...props}>
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
