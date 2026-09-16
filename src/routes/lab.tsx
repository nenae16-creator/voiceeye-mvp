import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { MeetingHud } from "@/components/hud/MeetingHud";

export const Route = createFileRoute("/lab")({ component: Lab });

function Lab() {
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <AppNav />
      <MeetingHud />
    </main>
  );
}
