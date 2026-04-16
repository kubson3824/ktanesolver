import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatModuleName } from "../../lib/utils";
import type { ModuleEntity } from "../../types";

interface SetupModuleManifestProps {
  modules: ModuleEntity[];
  canRemove: boolean;
  onRemove: (moduleId: string) => void;
}

export default function SetupModuleManifest({
  modules,
  canRemove,
  onRemove,
}: SetupModuleManifestProps) {
  const countsByType: Record<string, number> = {};

  return (
    <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Current modules</h3>
          <p className="text-xs text-muted-foreground">
            Remove individual modules from this bomb before the round starts.
          </p>
        </div>
        <Badge variant="outline">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {modules.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No modules added yet.</p>
      ) : (
        <div className="space-y-2">
          {modules.map((module) => {
            countsByType[module.type] = (countsByType[module.type] ?? 0) + 1;
            const moduleNumber = countsByType[module.type];
            const moduleName = formatModuleName(module.type);

            return (
              <div
                key={module.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{moduleName}</p>
                  <p className="text-xs text-muted-foreground">#{moduleNumber}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canRemove}
                  onClick={() => onRemove(module.id)}
                  aria-label={`Remove ${moduleName} #${moduleNumber}`}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!canRemove && (
        <p className="text-xs text-muted-foreground">
          Module removal is only available during setup.
        </p>
      )}
    </div>
  );
}
