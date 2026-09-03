import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

import { getPhotoUrl } from "@/services/identifyService";

/** Shows the evidence photo a tracker submitted, via a short-lived signed URL. */
export function SightingPhoto({
  path,
  alt,
  className = "",
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!path) return;
    getPhotoUrl(path)
      .then((signed) => {
        if (!active) return;
        if (signed) setUrl(signed);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div
        className={`grid h-40 w-full place-items-center rounded-xl border border-border bg-secondary text-muted-foreground ${className}`}
      >
        <div className="text-center">
          <ImageOff className="mx-auto size-5" />
          <p className="mt-1 text-[11px]">No photo available</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className={`h-40 w-full animate-pulse rounded-xl border border-border bg-secondary ${className}`}
      />
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-40 w-full rounded-xl border border-border object-cover ${className}`}
      />
    </a>
  );
}
