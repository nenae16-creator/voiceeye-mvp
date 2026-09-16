import { createFileRoute } from "@tanstack/react-router";
import { MeetingScenario } from "@/components/demo/MeetingScenario";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <MeetingScenario />;
}
