"use client";

import { useEffect } from "react";
import { toast } from "poyraz-ui/molecules";

export function ErrorToaster({ message }: { message: string }) {
  useEffect(() => {
    if (message) {
      toast.error(message);
    }
  }, [message])

  return null;
}
