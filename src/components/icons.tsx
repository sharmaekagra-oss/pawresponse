// A small hand-drawn-feel icon set, matching PawMark's personality —
// rounded strokes, slight imperfection, used in place of generic emoji
// wherever an icon is a primary visual anchor rather than incidental flavor.

export function AlertMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M24 5c1.4 0 2.6.8 3.2 2l15 27.5c1.3 2.4-.4 5.5-3.2 5.5H9c-2.8 0-4.5-3.1-3.2-5.5L20.8 7c.6-1.2 1.8-2 3.2-2Z"
        fill="currentColor"
      />
      <rect x="21.5" y="17" width="5" height="13" rx="2.4" fill="white" />
      <circle cx="24" cy="35" r="2.6" fill="white" />
    </svg>
  );
}

export function PinMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M24 4c8.8 0 15.5 7 15.5 15.5C39.5 30 27 41 24.9 43.6c-.5.6-1.3.6-1.8 0C21 41 8.5 30 8.5 19.5 8.5 11 15.2 4 24 4Z"
        fill="currentColor"
      />
      <circle cx="24" cy="19.5" r="6.2" fill="white" />
    </svg>
  );
}

export function MedicalMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M24 5c9.8 0 18 7.9 18 18.3S33.8 41 24 41 6 33.6 6 23.3 14.2 5 24 5Z"
        fill="currentColor"
      />
      <path
        d="M20.5 15h7v6.5H34v7h-6.5V35h-7v-6.5H14v-7h6.5V15Z"
        fill="white"
      />
    </svg>
  );
}

export function ClipboardMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="8" y="7" width="32" height="37" rx="6" fill="currentColor" />
      <rect x="17" y="4" width="14" height="8" rx="3" fill="currentColor" />
      <rect x="17" y="4" width="14" height="8" rx="3" fill="white" fillOpacity="0.35" />
      <path
        d="M15 21h18M15 28.5h18M15 36h11"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
