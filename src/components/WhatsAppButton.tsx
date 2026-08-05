export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP;
  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}`}
      className="fixed bottom-6 right-6 z-[130] grid h-13 w-13 place-content-center rounded-full border border-gold/50 bg-plum p-3.5 shadow-[0_10px_34px_rgba(20,10,16,.4)] transition-transform hover:-translate-y-1"
      aria-label="Message Anju Diam on WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-gold" aria-hidden>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.21-8.23 8.21Z" />
      </svg>
    </a>
  );
}
