import { useState } from "react";
import { ModuleType } from "../../types";
import { cn } from "../../lib/cn";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay } from "../common";

export default function VentingGasSolver() {
  const [answer, setAnswer] = useState<"yes" | "no">("yes");
  const twitchCommand = generateTwitchCommand({
    moduleType: ModuleType.VENTING_GAS,
    result: { answer },
  });

  return (
    <SolverLayout>
      <SolverSection
        title="Venting Gas"
        description="Choose the response requested by the active needy prompt."
      >
        <div className="grid grid-cols-2 gap-2">
          {(["yes", "no"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAnswer(value)}
              aria-pressed={answer === value}
              className={cn(
                "h-10 rounded-md border text-sm font-semibold uppercase",
                answer === value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </SolverSection>
      <TwitchCommandDisplay command={twitchCommand} />
      <SolverInstructions>
        Read the module prompt, select YES or NO here, then paste the generated command.
      </SolverInstructions>
    </SolverLayout>
  );
}
