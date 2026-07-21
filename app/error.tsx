"use client";

import { Button, Typography } from "poyraz-ui/atoms";

const copy = {
  tr: {
    title: "Bir şeyler ters gitti",
    description: "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.",
    retry: "Tekrar dene",
  },
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    retry: "Try again",
  },
};

function getCopy() {
  const language = typeof document === "undefined" ? "tr" : document.documentElement.lang;
  return language?.startsWith("en") ? copy.en : copy.tr;
}

export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = getCopy();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="mx-auto max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-lg font-semibold text-destructive">
          !
        </div>
        <div className="space-y-2">
          <Typography component="h1" variant="h1" className="text-3xl font-semibold">
            {t.title}
          </Typography>
          <Typography component="p" variant="muted" className="leading-6">
            {t.description}
          </Typography>
        </div>
        <Button effect="shine" type="button" onClick={reset}>
          {t.retry}
        </Button>
      </section>
    </main>
  );
}
