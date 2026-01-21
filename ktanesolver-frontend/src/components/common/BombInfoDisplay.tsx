import type { BombEntity } from "../../types";

interface BombInfoDisplayProps {
  bomb: BombEntity | null | undefined;
  showSerial?: boolean;
  showBatteries?: boolean;
  showIndicators?: boolean;
  showPorts?: boolean;
  showStrikes?: boolean;
  className?: string;
}

export default function BombInfoDisplay({ 
  bomb, 
  showSerial = true,
  showBatteries = false,
  showIndicators = false,
  showPorts = false,
  showStrikes = false,
  className = ""
}: BombInfoDisplayProps) {
  const hasVowel = bomb?.serialNumber ? /[AEIOU]/i.test(bomb.serialNumber) : false;

  return (
    <div className={`bg-base-200 rounded p-3 mb-4 ${className}`}>
      {showSerial && (
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
          {hasVowel && <span className="ml-2 text-xs badge badge-warning">HAS VOWEL</span>}
        </p>
      )}
      {showBatteries && (
        <p className="text-sm text-base-content/70">
          Batteries: <span className="font-mono font-bold">{(bomb?.aaBatteryCount ?? 0) + (bomb?.dBatteryCount ?? 0)}</span>
        </p>
      )}
      {showIndicators && (
        <p className="text-sm text-base-content/70">
          Indicators: <span className="font-mono font-bold">
            {bomb?.indicators ? Object.entries(bomb.indicators).filter(([, value]) => value).map(([key]) => key).join(", ") || "None" : "None"}
          </span>
        </p>
      )}
      {showPorts && (
        <p className="text-sm text-base-content/70">
          Ports: <span className="font-mono font-bold">
            {(() => {
              if (!bomb?.portPlates) return "None";
              const portCounts = bomb.portPlates.flatMap(plate => plate.ports).reduce((acc, port) => {
                acc[port] = (acc[port] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              return Object.entries(portCounts).filter(([, value]) => value > 0).map(([key, value]) => `${key}(${value})`).join(", ") || "None";
            })()}
          </span>
        </p>
      )}
      {showStrikes && (
        <p className="text-sm text-base-content/70">
          Strikes: <span className="font-mono font-bold">{bomb?.strikes || 0}</span>
        </p>
      )}
    </div>
  );
}
