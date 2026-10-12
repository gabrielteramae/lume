import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoginStage } from "@/components/login-stage";
import { NightDesk } from "@/components/night-desk";
import { useLume } from "@/lib/lume-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const sessionId = useLume((state) => state.sessionId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (useLume.persist.hasHydrated()) done();
    const unsub = useLume.persist.onFinishHydration(done);
    void useLume.persist.rehydrate();
    return unsub;
  }, []);

  if (!hydrated) return <main className="login-boot min-h-dvh" />;

  return <main className="min-h-dvh">{sessionId ? <NightDesk /> : <LoginStage />}</main>;
}
