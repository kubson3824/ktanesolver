import { Construction } from "lucide-react";
import type { SolverProps } from "./types";
import { SolverLayout, SolverSection } from "../common";
import { Alert } from "../ui/alert";

export default function VentingGasSolver({ bomb: _bomb }: SolverProps) {
  void _bomb;
  return (
    <SolverLayout>
      <SolverSection
        title="Venting Gas"
        description="Needy module — answer the prompts before pressure builds up."
      >
        <Alert variant="warning" className="flex items-start gap-2">
          <Construction className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Not implemented yet</p>
            <p className="mt-1 text-xs opacity-80">
              This module requires tracking gas levels and indicators. Solver
              support is coming in a future release.
            </p>
          </div>
        </Alert>
      </SolverSection>
    </SolverLayout>
  );
}
