/**
 * Logo Kata Stack: tri sloja (tri nivoa). Isti crtež kao `app/icon.svg`, bez pozadine.
 * Razmak između slojeva je izrezan maskom, pa logo radi na svetloj i na tamnoj temi.
 * Ukrasni je (aria-hidden): pored njega uvek stoji ime aplikacije.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 1.75 28 28"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <mask
          id="ks-logo-cut-top"
          maskUnits="userSpaceOnUse"
          x="-10"
          y="-10"
          width="60"
          height="60"
        >
          <rect x="-10" y="-10" width="60" height="60" fill="#fff" />
          <path
            d="M16 3.5 28.5 9.5 16 15.5 3.5 9.5Z"
            fill="#000"
            stroke="#000"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </mask>
        <mask
          id="ks-logo-cut-middle"
          maskUnits="userSpaceOnUse"
          x="-10"
          y="-10"
          width="60"
          height="60"
        >
          <rect x="-10" y="-10" width="60" height="60" fill="#fff" />
          <path
            d="M16 3.5 28.5 9.5 16 15.5 3.5 9.5Z"
            transform="translate(0 6.25)"
            fill="#000"
            stroke="#000"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <g mask="url(#ks-logo-cut-middle)">
        <path
          d="M16 3.5 28.5 9.5 16 15.5 3.5 9.5Z"
          transform="translate(0 12.5)"
          fill="#2563eb"
          stroke="#2563eb"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </g>
      <g mask="url(#ks-logo-cut-top)">
        <path
          d="M16 3.5 28.5 9.5 16 15.5 3.5 9.5Z"
          transform="translate(0 6.25)"
          fill="#3b82f6"
          stroke="#3b82f6"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M16 3.5 28.5 9.5 16 15.5 3.5 9.5Z"
        fill="#4ade80"
        stroke="#4ade80"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
