import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "회의 HUD" },
  { to: "/plan", label: "사업계획" },
  { to: "/bench", label: "인식률" },
] as const;

export function AppNav() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
      <p className="text-sm font-medium tracking-tight">보이스아이</p>
      <nav className="flex items-center gap-1 text-sm">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-md px-3 py-2 text-muted transition-colors duration-150 hover:text-fg data-[status=active]:bg-elevated data-[status=active]:text-fg"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
