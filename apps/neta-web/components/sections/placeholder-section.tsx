import * as React from "react";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id: string;
  title: string;
}

export function PlaceholderSection({ id, title, className, ...props }: SectionProps) {
  return (
    <section
      id={id}
      className={`min-h-screen flex items-center justify-center px-4 ${className || ""}`}
      {...props}
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{title} Bölümü</h2>
        <p className="text-muted-foreground">İçerik buraya gelecek...</p>
      </div>
    </section>
  );
}
