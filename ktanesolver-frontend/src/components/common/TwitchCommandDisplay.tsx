import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "../ui/button";

interface TwitchCommandDisplayProps {
  command: string | string[];
  className?: string;
}

export default function TwitchCommandDisplay({ command, className = "" }: TwitchCommandDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!command) return null;

  const commands = Array.isArray(command) ? command : [command];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {commands.map((cmd, index) => (
        <div
          key={index}
          className="bg-base-200 border border-base-300 rounded-sm px-3 py-2 flex items-center gap-2"
        >
          {commands.length > 1 && (
            <span className="text-xs text-ink-muted uppercase tracking-wide shrink-0">
              #{index + 1}
            </span>
          )}
          <code className="font-mono-code text-sm text-base-content flex-1 break-all">{cmd}</code>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => copyToClipboard(cmd, index)}
            title="Copy to clipboard"
            aria-label="Copy command to clipboard"
            className="shrink-0"
          >
            {copiedIndex === index ? (
              <span className="text-xs text-success">Copied!</span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
