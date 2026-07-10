"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
    <Button type={type} disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
