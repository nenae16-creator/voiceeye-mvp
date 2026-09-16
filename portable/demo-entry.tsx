import { createRoot } from "react-dom/client";
import { MeetingScenario } from "../src/components/demo/MeetingScenario";
import "../src/styles/meeting-demo.css";

createRoot(document.getElementById("root")!).render(<MeetingScenario portable />);
