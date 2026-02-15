import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

interface ManualPanelProps {
  manualUrl: string | null | undefined;
  moduleType: string;
}

export default function ManualPanel({ manualUrl, moduleType }: ManualPanelProps) {
  return (
    <Card className="h-full border-panel-border bg-base-200/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <p className="text-xs text-secondary uppercase tracking-wider">Reference</p>
        <CardTitle className="text-card-title mt-1">Manual</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col pt-0">
        {manualUrl ? (
          <iframe
            src={manualUrl}
            title={`${moduleType} manual`}
            className="w-full flex-1 rounded-lg min-h-[400px] border-0"
          />
        ) : (
          <div className="w-full flex-1 flex items-center justify-center text-base-content/50 min-h-[200px] rounded-lg bg-base-300/50 border border-base-300">
            <span className="loading loading-spinner loading-md mr-2"></span>
            <span className="text-caption">Loading manual...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
