import { Link } from "@tanstack/react-router";
import { Binoculars, Compass, Trophy, Users, BookMarked } from "lucide-react";

const ITEMS = [
  { to: "/game", label: "Home", Icon: Compass },
  { to: "/spot", label: "Spot", Icon: Binoculars },
  { to: "/rankings", label: "Rankings", Icon: Trophy },
  { to: "/collection", label: "Collection", Icon: BookMarked },
  { to: "/group", label: "Group", Icon: Users },
] as const;

export function BottomNav() {
  return (
    <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-popover/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary" }}
            >
              <Icon className="size-6" strokeWidth={1.8} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
