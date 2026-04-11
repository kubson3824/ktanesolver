import { useState, useEffect } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import { Alert } from "../../components/ui/alert";
import { formatModuleName } from "../../lib/utils";
import { ExternalLink } from "lucide-react";

interface ManualPanelProps {
  manualUrl: string | null | undefined;
  moduleType: string;
}

export default function ManualPanel({ manualUrl, moduleType }: ManualPanelProps) {
  const moduleName = formatModuleName(moduleType);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setIframeError(false);
  }, [manualUrl]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm h-full min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground truncate">{moduleName}</span>
        {manualUrl && (
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
            aria-label={`Open ${moduleName} manual in new tab`}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Open in new tab
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {manualUrl ? (
          iframeError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <Alert variant="destructive">
                Failed to load the module manual. Try opening it in a new tab.
              </Alert>
            </div>
          ) : (
            <iframe
              src={manualUrl}
              title={`${moduleType} manual`}
              className="w-full flex-1 border-0 min-h-[450px]"
              onError={() => setIframeError(true)}
            />
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 min-h-[200px]">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <p className="text-xs text-muted-foreground mt-2">Loading manual...</p>
          </div>
        )}
      </div>
    </div>
  );
}
