import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "패널 데모" },
  { to: "/strategy", label: "제품·AI" },
  { to: "/plan", label: "사업계획" },
  { to: "/bench", label: "인식률" },
] as const;

export function AppNav() {
  return (
    <header className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm font-medium tracking-tight">
        보이스아이 <span className="font-mono text-xs text-panel">CLEAR DESK</span>
      </p>
      <nav
        aria-label="주요 메뉴"
        className="grid w-full grid-cols-4 items-center gap-1 text-sm sm:flex sm:w-auto"
      >
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md px-2 py-2 text-muted transition-colors duration-150 hover:text-fg data-[status=active]:bg-elevated data-[status=active]:text-fg sm:px-3"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
