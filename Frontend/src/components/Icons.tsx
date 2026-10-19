import type { ReactNode } from "react";
export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
    diagonal: <path d="M6 18 18 6M6 6h12v12" />,
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    heart: (
      <path d="M20.7 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.7-8.5a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    shield: (
      <>
        <path d="m12 2 8 3v6c0 5-8 10-8 10S4 16 4 11V5l8-3Z" />
        <path d="m8 11 3 3 5-5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    truck: (
      <>
        <path d="M2 5h12v12H2zm12 5h4l4 5v2h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    tag: (
      <>
        <path d="m3 3 9 .1 9 9-9 9-9-9Z" />
        <circle cx="8" cy="8" r="1" />
      </>
    ),
    filter: (
      <>
        <path d="M3 6h18M3 12h18M3 18h18" />
        <path d="M7 3v6m10 0v6M9 15v6" strokeWidth="3" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    plus: <path d="M12 4v16M4 12h16" />,
    file: <path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8m-8 4h5" />,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8Z" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 1 1 4 3v2m0 3h.01" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="m2 5 10 8L22 5" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  };
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.grid}
    </svg>
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path
          d="M27 6h-9A12 12 0 0 0 6 18v8h10v-8a2 2 0 0 1 2-2h9Z"
          fill="currentColor"
        />
        <path
          d="M17 38h9a12 12 0 0 0 12-12v-8H28v8a2 2 0 0 1-2 2h-9Z"
          fill="currentColor"
        />
        <path d="M28 6h10v10H28ZM6 28h10v10H6Z" fill="#e98142" />
      </svg>
      <span>
        service<span className="brand-loop">loop</span>
        <span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function MachineIcon({ type }: { type: string }) {
  return (
    <svg
      className="machine-icon"
      viewBox="0 0 80 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "Heavy machinery" ? (
        <>
          <rect x="9" y="43" width="39" height="11" rx="5.5" />
          <path d="M15 47h27M16 42V28h20v14m-17-14V15h15l4 18h7v9M21 19h10v10H21m16-11 14-9 15 24-5 4-12-18-10 9M66 32l7 10-11 6-8-6 7-6M12 35h9m15 0h8" />
        </>
      ) : type === "Lifting equipment" ? (
        <>
          <path d="M8 42h56v8H8zm8 0V30h17v12m-13-12V19h11v11m2-8L57 7l3 5-25 17m23-17v23m-3-1v5a4 4 0 0 0 8 0M9 55h60M13 50v5m47-5v5" />
          <circle cx="22" cy="49" r="5" />
          <circle cx="52" cy="49" r="5" />
        </>
      ) : type === "Power & generators" ? (
        <>
          <rect x="12" y="15" width="55" height="36" rx="4" />
          <path d="M20 21h23v23H20zm29 0h10m-10 6h10m-10 6h10m-10 6h10m-43 5h47M20 51v5m38-5v5M29 15V9h21v6" />
          <path d="m33 25-7 8h7l-3 7" stroke="#d78249" />
        </>
      ) : type === "Concrete equipment" ? (
        <>
          <path d="m27 11 24 5 6 19-17 9-21-14 8-19Zm-2 6 28 7M19 30l-7 4 6 8 9-4m15 6 8 11M31 39 19 55h39M46 12l4-5m-6 0h11" />
          <circle cx="21" cy="51" r="6" />
          <circle cx="56" cy="51" r="6" />
        </>
      ) : type === "Scaffolding" ? (
        <path d="M15 7v49M64 7v49M15 12h49M15 32h49M15 51h49M19 15l41 33m0-33L19 48M10 56h10m39 0h10M10 29h59M10 9h59" />
      ) : (
        <>
          <path d="M12 32h40l9 10v9H12zM17 31V14h29v17m-29-13h29m-15-4v17m20 5h8l8 11h-16M10 51h59" />
          <circle cx="24" cy="51" r="6" />
          <circle cx="57" cy="51" r="6" />
        </>
      )}
    </svg>
  );
}
