import type { ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { BottomNav } from "./BottomNav";

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  online?: boolean;
  pendingCount?: number;
  /** ISO time of the last successful sync, shown while offline. */
  lastSynced?: string | null;
  action?: ReactNode;
}

export function ScreenShell({
  title,
  subtitle,
  children,
  online = true,
  pendingCount = 0,
  lastSynced,
  action,
}: ScreenShellProps) {
  return (
    <div className="bg-veld min-h-screen">
      <div className="mx-auto max-w-md px-4 pb-28 pt-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="display text-3xl leading-none text-gold-gradient">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </header>

        {!online || pendingCount > 0 ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            <WifiOff className="mt-0.5 size-4 shrink-0" />
            <span>
              {online
                ? `Syncing ${pendingCount} offline sighting${pendingCount === 1 ? "" : "s"}…`
                : `Offline — everything you do is saved on your phone${
                    pendingCount ? ` (${pendingCount} waiting)` : ""
                  }.`}
              {!online && lastSynced ? (
                <span className="block text-primary/80">
                  Scores last updated {new Date(lastSynced).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}

        {children}
      </div>
      <BottomNav />
    </div>
  );
}

