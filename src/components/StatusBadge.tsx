import { AlertTriangle, Clock, ShieldCheck, Users, XCircle } from "lucide-react";

import { STATUS_LABEL, type VerificationStatus } from "@/lib/verificationRules";
import { cn } from "@/lib/utils";

const STYLES: Record<VerificationStatus, string> = {
  pending: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  verified: "border-primary/40 bg-primary/15 text-primary",
  needs_community: "border-accent/40 bg-accent/15 text-accent",
  rejected: "border-destructive/40 bg-destructive/15 text-destructive",
};

const ICONS: Record<VerificationStatus, typeof Clock> = {
  pending: Clock,
  verified: ShieldCheck,
  needs_community: Users,
  rejected: XCircle,
};

export function toStatus(value: string | null | undefined): VerificationStatus {
  return value === "verified" || value === "needs_community" || value === "rejected"
    ? value
    : "pending";
}

export function StatusBadge({
  status,
  className,
  compact = false,
}: {
  status: string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const key = toStatus(status);
  const Icon = ICONS[key] ?? AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        STYLES[key],
        className,
      )}
    >
      <Icon className="size-3" />
      {compact ? null : STATUS_LABEL[key]}
    </span>
  );
}
