import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Binoculars, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { getDeviceId, loadSession, recalledName, rememberName } from "@/utils/session";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Profile — WildQuest" },
      {
        name: "description",
        content: "Set the name other trackers see and rejoin the game you already have open on this device.",
      },
      { property: "og:title", content: "My Profile — WildQuest" },
      {
        property: "og:description",
        content: "Manage your tracker name and rejoin your active WildQuest game.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setName(recalledName());
    setDeviceId(getDeviceId());
    setHasSession(Boolean(loadSession()));
  }, []);

  return (
    <main className="bg-veld min-h-screen">
      <div className="mx-auto max-w-md px-5 py-8">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="display text-4xl text-gold-gradient">My Profile</h1>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-2xl border border-border bg-input px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            placeholder="Tracker name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={() => {
              if (!name.trim()) {
                toast.error("Enter a name first");
                return;
              }
              rememberName(name.trim());
              toast.success("Name saved");
            }}
          >
            Save Name
          </Button>

          {hasSession ? (
            <Button variant="secondary" onClick={() => navigate({ to: "/game" })}>
              <Binoculars className="size-5" /> Back to My Game
            </Button>
          ) : null}
        </div>

        <div className="surface mt-8 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Smartphone className="size-4" /> Device ID
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground/70">{deviceId}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your progress is tied to this device, so no sign-up is needed.
          </p>
        </div>
      </div>
    </main>
  );
}
