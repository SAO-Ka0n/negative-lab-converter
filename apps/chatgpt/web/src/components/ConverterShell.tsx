import type { ReactNode } from "react";

export function ConverterShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">ChatGPT Photo Tool</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
