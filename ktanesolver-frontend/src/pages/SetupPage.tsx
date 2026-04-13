import {type FormEvent, useRef, useState, useCallback, useEffect} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {useRoundStore} from "../store/useRoundStore";
import {
    type BombEntity,
    ModuleType,
    PortType,
    RoundStatus,
} from "../types";
import BombCard from "../features/setup/BombCard";
import ModuleSelector from "../components/ModuleSelector";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import { getRoundStatusLabel } from "../lib/utils";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/cn";
import { Loader2 } from "lucide-react";

type IndicatorInput = {
    id: string;
    name: string;
    lit: boolean;
};

type PlateInput = {
    id: string;
    ports: PortType[];
};


type BombFormState = {
    serialNumber: string;
    aaBatteryCount: number;
    dBatteryCount: number;
    indicators: IndicatorInput[];
    portPlates: PlateInput[];
    modules: Record<string, number>;  // Changed from array to record for dynamic modules
};

const moduleTypes = Object.values(ModuleType);
const portTypes = Object.values(PortType);

const initialFormState = (): BombFormState => ({
    serialNumber: "",
    aaBatteryCount: 0,
    dBatteryCount: 0,
    indicators: [],
    portPlates: [],
    modules: {},
});

const randomId = () => Math.random().toString(36).slice(2, 10);

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export default function SetupPage() {
    const { roundId } = useParams<{ roundId: string }>();
    const navigate = useNavigate();
    const round = useRoundStore((state) => state.round);
    const fetchRound = useRoundStore((state) => state.fetchRound);
    const refreshRound = useRoundStore((state) => state.refreshRound);
    const addBomb = useRoundStore((state) => state.addBomb);
    const deleteBomb = useRoundStore((state) => state.deleteBomb);
    const configureBomb = useRoundStore((state) => state.configureBomb);
    const addModules = useRoundStore((state) => state.addModules);
    const startRound = useRoundStore((state) => state.startRound);
    const loading = useRoundStore((state) => state.loading);
    const error = useRoundStore((state) => state.error);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBomb, setEditingBomb] = useState<BombEntity | undefined>();
    const [formState, setFormState] = useState<BombFormState>(initialFormState);
    const [indicatorDraft, setIndicatorDraft] = useState<{
        name: string;
        lit: boolean;
    }>({name: "", lit: true});
    const [noticeCollapsed, setNoticeCollapsed] = useState(true);
    const [moduleTarget, setModuleTarget] = useState<BombEntity | undefined>();
    const [moduleDraft, setModuleDraft] = useState<Record<string, number>>(
        () =>
            moduleTypes.reduce(
                (acc, type) => {
                    acc[type] = 0;
                    return acc;
                },
                {} as Record<ModuleType, number>,
            ),
    );
    const stompClientRef = useRef<Client | null>(null);

    const isEditing = Boolean(editingBomb);
    const canStartRound = round && round.bombs.length > 0;

    useEffect(() => {
        if (!roundId) return;
        if (round?.id === roundId) return;
        let cancelled = false;
        fetchRound(roundId).catch(() => {
            if (!cancelled) void 0;
        });
        return () => { cancelled = true; };
    }, [roundId, round?.id, fetchRound]);

    // Subscribe to round topic so we refresh when another user updates bombs/modules during setup
    useEffect(() => {
        if (!roundId) return;
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as unknown as WebSocket,
            connectHeaders: {},
            onConnect: () => {
                client.subscribe(`/topic/rounds/${roundId}`, (message) => {
                    try {
                        const body = JSON.parse(message.body) as { type?: string };
                        if (body.type === "ROUND_UPDATED") {
                            void refreshRound(roundId);
                        }
                    } catch {
                        // ignore parse errors
                    }
                });
            },
        });
        client.activate();
        stompClientRef.current = client;
        return () => {
            client.deactivate();
            stompClientRef.current = null;
        };
    }, [roundId, refreshRound]);

    const openCreateForm = async () => {
        if (!round) return;
        setEditingBomb(undefined);
        setFormState(initialFormState());
        setIsFormOpen(true);
    };

    const openEditForm = (bomb: BombEntity) => {
        setEditingBomb(bomb);
        setFormState({
            serialNumber: bomb.serialNumber ?? "",
            aaBatteryCount: bomb.aaBatteryCount ?? 0,
            dBatteryCount: bomb.dBatteryCount ?? 0,
            indicators: Object.entries(bomb.indicators ?? {}).map(
                ([name, lit]) => ({
                    id: randomId(),
                    name,
                    lit,
                }),
            ),
            portPlates: (bomb.portPlates ?? []).map((plate) => ({
                id: randomId(),
                ports: plate.ports ?? [],
            })),
            modules: bomb.modules?.reduce((acc, module) => {
                acc[module.type] = (acc[module.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>) ?? {},
        });
        setIsFormOpen(true);
    };

    const addIndicator = () => {
        if (!indicatorDraft.name.trim()) return;
        setFormState((prev) => ({
            ...prev,
            indicators: [
                ...prev.indicators,
                {
                    id: randomId(),
                    name: indicatorDraft.name.trim().toUpperCase(),
                    lit: indicatorDraft.lit,
                },
            ],
        }));
        setIndicatorDraft({name: "", lit: true});
    };

    const updatePlate = (plateId: string, port: PortType) => {
        setFormState((prev) => ({
            ...prev,
            portPlates: prev.portPlates.map((plate) =>
                plate.id === plateId
                    ? {
                        ...plate,
                        ports: plate.ports.includes(port)
                            ? plate.ports.filter((p) => p !== port)
                            : [...plate.ports, port],
                    }
                    : plate,
            ),
        }));
    };


    const handleFormSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const indicatorMap = Object.fromEntries(
            formState.indicators.map((indicator) => [indicator.name, indicator.lit]),
        );
        const edgeworkPayload = {
            serialNumber: formState.serialNumber.trim(),
            aaBatteryCount: formState.aaBatteryCount,
            dBatteryCount: formState.dBatteryCount,
            indicators: indicatorMap,
            portPlates: formState.portPlates.map((plate) => plate.ports),
        };

        if (isEditing && editingBomb) {
            await configureBomb(editingBomb.id, edgeworkPayload);
            setIsFormOpen(false);
            setEditingBomb(undefined);
            return;
        }

        const initialModules = Object.fromEntries(
            Object.entries(formState.modules).filter(
                ([, count]) => count > 0,
            ) as [string, number][],
        ) as Partial<Record<ModuleType, number>>;

        await addBomb({
            ...edgeworkPayload,
            modules: initialModules,
        });
        setIsFormOpen(false);
        setFormState(initialFormState());
    };

    const openModulePanel = (bomb: BombEntity) => {
        setModuleTarget(bomb);
        setModuleDraft({});
    };

    const submitModuleDraft = async () => {
        if (!moduleTarget) return;
        const entries = Object.entries(moduleDraft).filter(
            ([, count]) => count > 0,
        ) as [string, number][];
        if (entries.length === 0) {
            setModuleTarget(undefined);
            return;
        }
        await Promise.all(
            entries.map(([type, count]) =>
                addModules(moduleTarget.id, {type: type as ModuleType, count}),
            ),
        );
        setModuleTarget(undefined);
    };

    const roundStatusLabel = round ? getRoundStatusLabel(round.status) : "No round";

    const handleModuleSelectionChange = useCallback((selectedModules: Record<string, number>) => {
        setFormState(prev => ({
            ...prev,
            modules: selectedModules
        }));
    }, []);

    const handleStartRound = async () => {
        if (!round) return;
        const updated = await startRound();
        navigate(`/solve/${updated.id}`);
    };

    const handleContinueRound = () => {
        if (!round) return;
        navigate(`/solve/${round.id}`);
    };

    const roundNotYetLoaded = roundId && (!round || round.id !== roundId);
    if (roundId && (roundNotYetLoaded || loading) && !round) {
        return (
            <PageContainer className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </PageContainer>
        );
    }

    const totalModules = round?.bombs.reduce((sum, bomb) => sum + (bomb.modules?.length ?? 0), 0) ?? 0;

    return (
        <PageContainer>
            <PageHeader
                title="Round Setup"
                actions={
                    <Button
                        variant="default"
                        disabled={!canStartRound || loading}
                        loading={loading && canStartRound ? true : undefined}
                        onClick={round?.status === RoundStatus.ACTIVE ? handleContinueRound : handleStartRound}
                    >
                        {round?.status === RoundStatus.ACTIVE ? "Continue Round" : "Start Round"}
                    </Button>
                }
            />

            <div className="grid gap-5">
                {/* Notice */}
                <Alert variant="warning" className="mb-0 flex items-start gap-3 [&>svg]:!relative [&>svg]:!left-0 [&>svg]:!top-0 [&>svg+div]:!translate-y-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 min-w-0 pt-0 !pl-0">
                        <button
                            type="button"
                            className="flex items-center gap-2 w-full text-left"
                            onClick={() => setNoticeCollapsed((c) => !c)}
                            aria-expanded={!noticeCollapsed}
                        >
                            <AlertTitle className="mb-0">Important Notice</AlertTitle>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn("h-4 w-4 shrink-0 transition-transform ml-auto", !noticeCollapsed && "rotate-180")}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {!noticeCollapsed && (
                            <AlertDescription className="mt-2">
                                This solver is intended for educational purposes to help learn algorithms and problem-solving techniques.
                                The creator does not condone using solvers during actual Keep Talking and Nobody Explodes gameplay.
                                The game is designed to be fun and challenging—mistakes are part of the experience!
                            </AlertDescription>
                        )}
                    </div>
                </Alert>

                {/* Stats row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="rounded-xl border border-border bg-card shadow-sm flex-1 px-4 py-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Bombs</p>
                        <p className="font-display text-2xl font-bold text-base-content">{round?.bombs.length ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card shadow-sm flex-1 px-4 py-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Modules</p>
                        <p className="font-display text-2xl font-bold text-base-content">{totalModules}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card shadow-sm flex-1 px-4 py-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                        <p className={cn("font-display text-2xl font-bold", canStartRound ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                            {round ? roundStatusLabel : "No Round"}
                        </p>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Add bomb + bomb grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-foreground">Bomb Manifest</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={openCreateForm}
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Bomb
                        </Button>
                    </div>

                    {round?.bombs.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {round.bombs.map((bomb, index) => (
                                <BombCard
                                    key={bomb.id}
                                    bomb={bomb}
                                    index={index}
                                    onEditEdgework={openEditForm}
                                    onAddModules={openModulePanel}
                                    onDelete={(b) => {
                                        if (window.confirm(`Delete bomb #${round.bombs.indexOf(b) + 1}? This will also remove all its modules.`)) {
                                            void deleteBomb(b.id);
                                        }
                                    }}
                                    animationDelay={index * 50}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card shadow-sm text-center py-12 px-4">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-base-200 mb-4" aria-hidden>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">No bombs configured yet.</p>
                            <p className="text-xs text-muted-foreground mb-5">
                                1. Click Add Bomb → 2. Enter serial and edgework → 3. Add modules → 4. Start round
                            </p>
                            <Button
                                variant="default"
                                onClick={openCreateForm}
                                disabled={loading}
                            >
                                Add your first bomb
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Link
                        to="/rounds"
                        className="text-sm text-muted-foreground hover:text-base-content transition-colors"
                    >
                        ← Previous rounds
                    </Link>
                    {round && (
                        <Badge variant="default" className="gap-1.5">
                            Round:&nbsp;<strong>{roundStatusLabel}</strong>
                        </Badge>
                    )}
                </div>

                {/* Bomb form dialog */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-h-[90vh] flex flex-col gap-0 p-0">
                        <DialogHeader className="bg-muted/40 border-b border-border px-4 py-3 flex flex-row items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                                    {isEditing ? "Update" : "Configure"} bomb
                                </p>
                                <DialogTitle className="font-display text-lg font-bold uppercase mt-0.5">
                                    {isEditing ? "Edgework Adjustments" : "New Bomb Setup"}
                                </DialogTitle>
                            </div>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" size="sm">
                                    Close
                                </Button>
                            </DialogClose>
                        </DialogHeader>
                        <form className="flex flex-col flex-1 min-h-0 overflow-hidden" onSubmit={handleFormSubmit}>
                            <div className="overflow-y-auto px-4 sm:px-6 space-y-6 pb-4 pt-4">
                                <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
                                    <h3 className="text-base font-semibold text-foreground">Serial &amp; Batteries</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <label className="flex flex-col gap-1.5 w-full">
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Serial number</span>
                                            <Input
                                                type="text"
                                                value={formState.serialNumber}
                                                onChange={(event) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        serialNumber: event.target.value.toUpperCase(),
                                                    }))
                                                }
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1.5 w-full">
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">AA batteries</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={2}
                                                value={formState.aaBatteryCount}
                                                onChange={(event) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        aaBatteryCount: Number(event.target.value),
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1.5 w-full">
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">D batteries</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={formState.dBatteryCount}
                                                onChange={(event) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        dBatteryCount: Number(event.target.value),
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
                                    <h3 className="text-base font-semibold text-foreground">Indicators</h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Label"
                                            className="w-24 h-8"
                                            value={indicatorDraft.name}
                                            onChange={(event) =>
                                                setIndicatorDraft((prev) => ({
                                                    ...prev,
                                                    name: event.target.value,
                                                }))
                                            }
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={cn("gap-1.5", indicatorDraft.lit && "border-emerald-500 text-emerald-700 dark:text-emerald-400")}
                                                onClick={() => setIndicatorDraft((p) => ({ ...p, lit: true }))}
                                            >
                                                <span className="h-2 w-2 rounded-full bg-current opacity-90" aria-hidden />
                                                Lit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={!indicatorDraft.lit ? "ghost" : "outline"}
                                                size="sm"
                                                className={cn("gap-1.5", !indicatorDraft.lit && "bg-base-300")}
                                                onClick={() => setIndicatorDraft((p) => ({ ...p, lit: false }))}
                                            >
                                                <span className="h-2 w-2 rounded-full bg-base-content/40" aria-hidden />
                                                Unlit
                                            </Button>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addIndicator}>
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formState.indicators.map((indicator) => (
                                            <Badge
                                                key={indicator.id}
                                                variant={indicator.lit ? "success" : "outline"}
                                                className="gap-2 pr-1"
                                            >
                                                <span
                                                    className={cn(
                                                        "h-2 w-2 rounded-full shrink-0",
                                                        indicator.lit ? "bg-emerald-500/80" : "bg-foreground/50"
                                                    )}
                                                    aria-hidden
                                                />
                                                {indicator.name}
                                                <button
                                                    type="button"
                                                    className="p-0 h-4 min-h-4 w-4 inline-flex items-center justify-center rounded hover:bg-base-content/10 text-base-content/80"
                                                    onClick={() =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            indicators: prev.indicators.filter(
                                                                (entry) => entry.id !== indicator.id,
                                                            ),
                                                        }))
                                                    }
                                                    aria-label={`Remove ${indicator.name}`}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                        {formState.indicators.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No indicators yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-base font-semibold text-foreground">Port Plates</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    portPlates: [
                                                        ...prev.portPlates,
                                                        {id: randomId(), ports: []},
                                                    ],
                                                }))
                                            }
                                        >
                                            Add plate
                                        </Button>
                                    </div>
                                    {formState.portPlates.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">No plates configured.</p>
                                    )}
                                    <div className="space-y-3">
                                        {formState.portPlates.map((plate, index) => (
                                            <div key={plate.id} className="bg-background border border-border rounded-sm p-3">
                                                <div className="flex justify-between items-center mb-3">
                                                    <strong className="text-xs text-muted-foreground uppercase tracking-widest">Plate {index + 1}</strong>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="xs"
                                                        onClick={() =>
                                                            setFormState((prev) => ({
                                                                ...prev,
                                                                portPlates: prev.portPlates.filter(
                                                                    (entry) => entry.id !== plate.id,
                                                                ),
                                                            }))
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {portTypes.map((port) => (
                                                        <Button
                                                            key={port}
                                                            type="button"
                                                            variant={plate.ports.includes(port) ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => updatePlate(plate.id, port)}
                                                        >
                                                            {port}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
                                        <h3 className="text-base font-semibold text-foreground">Modules for this bomb</h3>
                                        <ModuleSelector
                                            onSelectionChange={handleModuleSelectionChange}
                                            initialCounts={formState.modules}
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="border-t border-border bg-muted/40">
                                <Button
                                    type="submit"
                                    variant="default"
                                    disabled={loading}
                                    loading={loading}
                                >
                                    {isEditing ? "Save changes" : "Save bomb"}
                                </Button>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Module drawer */}
                {moduleTarget && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-base-content/20 backdrop-blur-sm animate-fade-in"
                            aria-hidden
                            onClick={() => setModuleTarget(undefined)}
                        />
                        <aside
                            className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-background shadow-xl animate-slide-in-right flex flex-col border-l border-border"
                            role="dialog"
                            aria-labelledby="module-drawer-title"
                            aria-modal="true"
                        >
                            <div className="bg-muted/40 border-b border-border px-4 py-3 flex items-start justify-between gap-4 shrink-0">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Module injection</p>
                                    <h2 id="module-drawer-title" className="font-display text-lg font-bold uppercase mt-0.5">
                                        Add modules to {moduleTarget.serialNumber}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    className="p-1.5 rounded-sm text-muted-foreground hover:bg-base-300 hover:text-base-content transition-colors"
                                    onClick={() => setModuleTarget(undefined)}
                                    aria-label="Close"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                <ModuleSelector
                                    onSelectionChange={(selectedModules) => {
                                        setModuleDraft(selectedModules as Record<ModuleType, number>);
                                    }}
                                    initialCounts={moduleDraft}
                                />
                            </div>
                            <div className="bg-muted/40 border-t border-border px-4 py-3 flex justify-end gap-2 shrink-0">
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={submitModuleDraft}
                                    disabled={loading}
                                    loading={loading}
                                >
                                    Save modules
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModuleTarget(undefined)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </aside>
                    </>
                )}
            </div>
        </PageContainer>
    );
}
