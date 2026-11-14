export function CopticCrossIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M32 6v52M12 32h40" />
      <path d="M26 10l6-4 6 4M26 54l6 4 6-4M16 26l-4 6 4 6M48 26l4 6-4 6" />
      <circle cx="32" cy="32" r="7" />
      <path d="M22 22l5 5M42 22l-5 5M22 42l5-5M42 42l-5-5" />
    </svg>
  );
}
