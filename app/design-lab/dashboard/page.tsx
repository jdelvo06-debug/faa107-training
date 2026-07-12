import { StudioShell } from "../studio-shell";
import { DashboardPrototype } from "./dashboard-prototype";

export default function DashboardPrototypePage() {
  return (
    <StudioShell active="dashboard">
      <DashboardPrototype />
    </StudioShell>
  );
}
