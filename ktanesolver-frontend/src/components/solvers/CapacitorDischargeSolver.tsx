import { Construction } from "lucide-react";
import type { SolverProps } from "./types";
import { SolverLayout, SolverSection } from "../common";
import { Alert } from "../ui/alert";

export default function CapacitorDischargeSolver({ bomb: _bomb }: SolverProps) {
  void _bomb;
  return (
    <SolverLayout>
      <SolverSection
        title="Capacitor Discharge"
        description="Needy module — discharge the capacitor before the timer runs out."
      >
        <Alert variant="warning" className="flex items-start gap-2">
          <Construction className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Not implemented yet</p>
            <p className="mt-1 text-xs opacity-80">
              This module requires timing information. Solver support is coming
              in a future release.
            </p>
          </div>
        </Alert>
      </SolverSection>
    </SolverLayout>
  );
}
