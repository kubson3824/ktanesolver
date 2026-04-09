import { Skeleton } from "../../components/ui/skeleton";
import { formatModuleName } from "../../lib/utils";

interface ManualPanelProps {
  manualUrl: string | null | undefined;
  moduleType: string;
}

export default function ManualPanel({ manualUrl, moduleType }: ManualPanelProps) {
  const moduleName = formatModuleName(moduleType);

  return (
    <div className="bg-white border border-base-content rounded-sm shadow-card h-full min-h-[500px] flex flex-col">
      {/* Header strip */}
      <div className="bg-base-200 border-b border-base-300 px-3 py-2 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-base-content truncate">{moduleName}</span>
        {manualUrl && (
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-ink-muted hover:text-base-content transition-colors ml-2 shrink-0"
            aria-label={`Open ${moduleName} manual in new tab`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open in new tab
          </a>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {manualUrl ? (
          <iframe
            src={manualUrl}
            title={`${moduleType} manual`}
            className="w-full flex-1 border-0 min-h-[450px]"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 min-h-[200px]">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <p className="text-xs text-ink-muted mt-2">Loading manual...</p>
          </div>
        )}
      </div>
    </div>
  );
}
