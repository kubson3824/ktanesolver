import { useState } from "react";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay } from "../common";
import { Input } from "../ui/input";

export default function CapacitorDischargeSolver() {
  const [holdSeconds, setHoldSeconds] = useState(7);
  const twitchCommand = generateTwitchCommand({
    moduleType: ModuleType.CAPACITOR_DISCHARGE,
    result: { holdSeconds },
  });

  return (
    <SolverLayout>
      <SolverSection
        title="Capacitor Discharge"
        description="Enter how long Twitch should hold the discharge lever."
      >
        <label className="block text-sm font-medium">
          Hold duration (seconds)
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={holdSeconds}
            onChange={(event) => setHoldSeconds(event.target.valueAsNumber)}
            className="mt-2"
          />
        </label>
      </SolverSection>
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>
        Paste the command while the needy is active. Seven seconds is the standard Twitch Plays
        example; shorten it if the bomb timer cannot safely spare that long.
      </SolverInstructions>
    </SolverLayout>
  );
}
