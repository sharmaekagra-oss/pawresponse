export default function PawMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 32c7.5 0 13.5 4.5 15.5 12.3 1.7 6.6-4.4 13.3-11.2 11.2-2.8-.9-5.9-1.3-8.6 0-6.8 2.1-12.9-4.6-11.2-11.2C18.5 36.5 24.5 32 32 32Z"
        fill="currentColor"
      />
      <ellipse
        cx="14"
        cy="26"
        rx="6.2"
        ry="8"
        transform="rotate(-18 14 26)"
        fill="currentColor"
      />
      <ellipse
        cx="26"
        cy="14"
        rx="6.6"
        ry="8.4"
        transform="rotate(-4 26 14)"
        fill="currentColor"
      />
      <ellipse
        cx="40"
        cy="13"
        rx="6.6"
        ry="8.4"
        transform="rotate(6 40 13)"
        fill="currentColor"
      />
      <ellipse
        cx="51"
        cy="25"
        rx="6.2"
        ry="8"
        transform="rotate(20 51 25)"
        fill="currentColor"
      />
    </svg>
  );
}
