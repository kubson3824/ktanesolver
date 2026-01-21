interface TwitchCommandDisplayProps {
  command: string | string[];
  className?: string;
}

export default function TwitchCommandDisplay({ command, className = "" }: TwitchCommandDisplayProps) {
  if (!command) return null;

  const commands = Array.isArray(command) ? command : [command];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4 ${className}`}>
      <div className="space-y-3">
        {commands.map((cmd, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              {commands.length > 1 && (
                <h4 className="text-sm font-medium text-purple-400 mb-1">
                  Command {index + 1}:
                </h4>
              )}
              <code className="text-lg font-mono text-purple-200">{cmd}</code>
            </div>
            <button
              onClick={() => copyToClipboard(cmd)}
              className="btn btn-sm btn-outline btn-purple ml-4"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
