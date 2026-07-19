import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "../ui/button";
import { useRoundStore } from "../../store/useRoundStore";

interface TwitchCommandDisplayProps {
  command: string | string[];
  className?: string;
}

export default function TwitchCommandDisplay({ command, className = "" }: TwitchCommandDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const twitchCode = useRoundStore((state) => state.currentModule?.twitchCode);

  if (!command) return null;

  const commands = (Array.isArray(command) ? command : [command])
    .flatMap((item) => item.split(/;\s*/))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.startsWith("!") ? item : `!number ${item}`)
    .map((item) => twitchCode ? item.replaceAll("!number", `!${twitchCode}`) : item);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!twitchCode && (
        <p className="text-xs text-warning">Set the Twitch selector above before copying.</p>
      )}
      {commands.map((cmd, index) => {
        const unsupported = /\bunknown\b/i.test(cmd);
        return (
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
              title={unsupported ? "This module did not produce a complete Twitch command" : "Copy to clipboard"}
              aria-label="Copy command to clipboard"
              disabled={!twitchCode || unsupported}
              className="shrink-0"
            >
              {copiedIndex === index ? (
                <span className="text-xs text-success">Copied!</span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
