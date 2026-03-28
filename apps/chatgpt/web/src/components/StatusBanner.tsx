interface StatusBannerProps {
  tone: "neutral" | "success" | "warning" | "error";
  message: string;
}

export function StatusBanner({ tone, message }: StatusBannerProps) {
  return (
    <section className={`status-banner status-${tone}`} aria-live="polite">
      <p>{message}</p>
    </section>
  );
}
