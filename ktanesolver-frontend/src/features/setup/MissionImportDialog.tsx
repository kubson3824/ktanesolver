import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadMissions, type MissionDefinition } from "../../services/missionService";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";

type MissionImportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (mission: MissionDefinition) => void;
};

export default function MissionImportDialog({open, onOpenChange, onSelect}: MissionImportDialogProps) {
    const [missions, setMissions] = useState<MissionDefinition[]>([]);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || missions.length > 0 || error) return;
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) setLoading(true);
        });
        loadMissions()
            .then((loaded) => {
                if (!cancelled) {
                    setMissions(loaded);
                    setLoading(false);
                }
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    setError(reason instanceof Error ? reason.message : "Could not load missions");
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [open, missions.length, error]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return missions
            .filter((mission) => !needle || `${mission.name} ${mission.packName} ${mission.authors.join(" ")}`.toLowerCase().includes(needle))
            .slice(0, 100);
    }, [missions, query]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Import mission</DialogTitle>
                    <DialogDescription>
                        Select a mission, then enter the edgework for each bomb.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-5 flex flex-col gap-3 min-h-0">
                    <Input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search mission, pack, or author…"
                        aria-label="Search missions"
                    />
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription className="flex items-center justify-between gap-3">
                                <span>{error}</span>
                                <Button size="sm" variant="outline" onClick={() => setError(undefined)}>Retry</Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading mission catalog…
                        </div>
                    ) : (
                        <div className="overflow-y-auto rounded-lg border border-border divide-y divide-border">
                            {filtered.map((mission) => {
                                const moduleCount = mission.bombs.reduce((sum, bomb) => sum + bomb.modules, 0);
                                return (
                                    <button
                                        key={mission.id}
                                        type="button"
                                        className="w-full p-3 text-left hover:bg-muted transition-colors"
                                        onClick={() => {
                                            onSelect(mission);
                                            onOpenChange(false);
                                        }}
                                    >
                                        <span className="block text-sm font-semibold text-foreground">{mission.name}</span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                            {mission.packName} · {mission.bombs.length} {mission.bombs.length === 1 ? "bomb" : "bombs"} · {moduleCount} modules
                                        </span>
                                    </button>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <p className="p-6 text-center text-sm text-muted-foreground">No missions found.</p>
                            )}
                        </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                        Catalog from <a className="underline" href="https://bombs.samfun.dev" target="_blank" rel="noreferrer">bombs.samfun.dev</a>.
                    </p>
                </div>
                <div className="px-5 py-4 border-t border-border bg-muted/40 flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
