import {type FormEvent, useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
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
import { getRoundStatusLabel } from "../lib/utils";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
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

export default function SetupPage() {
    const navigate = useNavigate();
    const round = useRoundStore((state) => state.round);
    const createRound = useRoundStore((state) => state.createRound);
    const addBomb = useRoundStore((state) => state.addBomb);
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

    const isEditing = Boolean(editingBomb);
    const canStartRound = round && round.bombs.length > 0;

    const ensureRound = async () => {
        if (!round) {
            await createRound();
        }
    };

    const openCreateForm = async () => {
        await ensureRound();
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
        const payload = {
            serialNumber: formState.serialNumber.trim(),
            aaBatteryCount: formState.aaBatteryCount,
            dBatteryCount: formState.dBatteryCount,
            indicators: indicatorMap,
            portPlates: formState.portPlates.map((plate) => plate.ports),
        };

        if (isEditing && editingBomb) {
            await configureBomb(editingBomb.id, payload);
            setIsFormOpen(false);
            setEditingBomb(undefined);
            return;
        }

        const newBomb = await addBomb(payload);
        const moduleEntries = Object.entries(formState.modules).filter(
            ([, count]) => count > 0,
        ) as [string, number][];
        if (moduleEntries.length > 0) {
            await Promise.all(
                moduleEntries.map(([type, count]) =>
                    addModules(newBomb.id, {type: type as ModuleType, count}),
                ),
            );
        }
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

    return (
        <PageContainer>
            <div className="grid gap-5">
                <Alert variant="warning" className="mb-5 flex items-center gap-3 [&>svg]:!relative [&>svg]:!left-0 [&>svg]:!top-0 [&>svg+div]:!translate-y-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 -translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

                <Card className="animate-fade-in border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
                    <CardHeader className="space-y-6 pb-6">
                        <section className="w-full min-w-0">
                            <p className="text-sm text-secondary font-medium uppercase tracking-wider">Round preparation</p>
                            <h1 className="text-page-title mt-2 mb-2">Build your bomb roster</h1>
                            <p className="text-caption text-base-content/70 mb-2">
                                Add bombs → Set edgework → Add modules → Start round
                            </p>
                            <p className="text-body text-base-content/70 max-w-xl mb-6">
                                Capture edgework, curate modules, and hand off the binder to the
                                expert team before the timer even starts ticking.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    className="btn btn-primary"
                                    onClick={openCreateForm}
                                    disabled={loading}
                                >
                                    Add Bomb
                                </button>
                                {round && (
                                    <span className="badge badge-outline gap-2">
                                        Round status:&nbsp;
                                        <strong>{roundStatusLabel}</strong>
                                    </span>
                                )}
                            </div>
                        </section>
                        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full border-t border-base-300 pt-6">
                            <div className="flex flex-col gap-1 bg-base-300/50 rounded-lg px-4 py-3 border border-base-300 min-w-0">
                                <div className="flex items-center gap-2 text-secondary shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-xs font-medium uppercase tracking-wider truncate">Total bombs</span>
                                </div>
                                <div className="text-2xl font-bold tabular-nums truncate">{round?.bombs.length ?? 0}</div>
                            </div>
                            <div className="flex flex-col gap-1 bg-base-300/50 rounded-lg px-4 py-3 border border-base-300 min-w-0">
                                <div className="flex items-center gap-2 text-secondary shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span className="text-xs font-medium uppercase tracking-wider truncate">Modules queued</span>
                                </div>
                                <div className="text-2xl font-bold tabular-nums truncate">
                                    {round?.bombs.reduce(
                                        (sum, bomb) => sum + (bomb.modules?.length ?? 0),
                                        0,
                                    ) ?? 0}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 bg-base-300/50 rounded-lg px-4 py-3 border border-base-300 min-w-0">
                                <div className="flex items-center gap-2 text-secondary shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs font-medium uppercase tracking-wider truncate">Ready checks</span>
                                </div>
                                <div className={cn("text-2xl font-bold truncate", canStartRound ? "text-success" : "text-warning")}>
                                    {canStartRound ? "All green" : "Pending"}
                                </div>
                            </div>
                        </section>
                    </CardHeader>
                </Card>

                {error && (
                    <Alert variant="error">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-secondary font-medium uppercase tracking-wider">Current round</p>
                            <CardTitle className="text-section-title mt-1">Bomb manifest</CardTitle>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={openCreateForm}
                                disabled={loading}
                            >
                                Add Bomb
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                disabled={!canStartRound || loading}
                                onClick={round?.status === RoundStatus.ACTIVE ? handleContinueRound : handleStartRound}
                            >
                                {round?.status === RoundStatus.ACTIVE ? "Continue Round" : "Start Round"}
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {round?.bombs.length ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {round.bombs.map((bomb, index) => (
                                    <BombCard
                                        key={bomb.id}
                                        bomb={bomb}
                                        onEditEdgework={openEditForm}
                                        onAddModules={openModulePanel}
                                        animationDelay={index * 50}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-300 mb-4" aria-hidden>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <p className="text-body text-base-content/70 mb-2">No bombs configured yet.</p>
                                <p className="text-caption text-base-content/60 mb-6">
                                    1. Click Add Bomb → 2. Enter serial and edgework → 3. Add modules → 4. Start round
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={openCreateForm}
                                    disabled={loading}
                                >
                                    Add your first bomb
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-h-[90vh] flex flex-col gap-0 p-0">
                        <DialogHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <p className="text-caption text-secondary font-medium uppercase tracking-wider">
                                    {isEditing ? "Update" : "Configure"} bomb
                                </p>
                                <DialogTitle className="text-section-title mt-1">
                                    {isEditing ? "Edgework adjustments" : "New bomb setup"}
                                </DialogTitle>
                            </div>
                            <DialogClose asChild>
                                <button type="button" className="btn btn-outline btn-sm">
                                    Close
                                </button>
                            </DialogClose>
                        </DialogHeader>
                        <form className="flex flex-col flex-1 min-h-0 overflow-hidden" onSubmit={handleFormSubmit}>
                            <div className="overflow-y-auto px-4 sm:px-6 space-y-6 pb-4">
                                <div className="rounded-lg border border-base-300 bg-base-200/50 p-4 space-y-4">
                                    <h3 className="text-card-title font-semibold">Serial & batteries</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="flex flex-col gap-1.5 w-full">
                                            <span className="text-caption text-secondary">Serial number</span>
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
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex flex-col gap-1.5 w-full">
                                                <span className="text-caption text-secondary">AA batteries</span>
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
                                                <span className="text-caption text-secondary">D batteries</span>
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
                                </div>

                                <div className="rounded-lg border border-base-300 bg-base-200/50 p-4 space-y-4">
                                    <h3 className="text-card-title font-semibold">Indicators</h3>
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
                                                variant={indicatorDraft.lit ? "success" : "outline"}
                                                size="sm"
                                                className="gap-1.5"
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
                                                        indicator.lit ? "bg-success-content/80" : "bg-base-content/50"
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
                                            <p className="text-caption text-base-content/50 italic">No indicators yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-base-300 bg-base-200/50 p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-card-title font-semibold">Port plates</h3>
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
                                        <p className="text-caption text-base-content/50 italic">No plates configured.</p>
                                    )}
                                    <div className="space-y-3">
                                        {formState.portPlates.map((plate, index) => (
                                            <Card key={plate.id} className="bg-base-200/80">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <strong className="text-caption">Plate {index + 1}</strong>
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
                                                                variant={plate.ports.includes(port) ? "primary" : "outline"}
                                                                size="sm"
                                                                onClick={() => updatePlate(plate.id, port)}
                                                            >
                                                                {port}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="rounded-lg border border-base-300 bg-base-200/50 p-4 space-y-4">
                                        <h3 className="text-card-title font-semibold">Modules for this bomb</h3>
                                        <ModuleSelector
                                            onSelectionChange={handleModuleSelectionChange}
                                            initialCounts={formState.modules}
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="border-t border-base-300 bg-base-200/80">
                                <Button
                                    type="submit"
                                    variant="primary"
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

                {moduleTarget && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-base-content/20 backdrop-blur-sm animate-fade-in"
                            aria-hidden
                            onClick={() => setModuleTarget(undefined)}
                        />
                        <aside
                            className="fixed top-0 right-0 z-50 h-full w-full max-w-lg border-panel-border bg-base-200/90 backdrop-blur-xl shadow-xl animate-slide-in-right flex flex-col border-l"
                            role="dialog"
                            aria-labelledby="module-drawer-title"
                            aria-modal="true"
                        >
                            <Card className="rounded-none border-0 flex-1 flex flex-col min-h-0 bg-transparent shadow-none">
                                <CardHeader className="flex flex-row items-start justify-between gap-4 shrink-0">
                                    <div>
                                        <p className="text-sm text-secondary font-medium uppercase tracking-wider">Module injection</p>
                                        <CardTitle id="module-drawer-title" className="text-section-title mt-1">
                                            Add modules to {moduleTarget.serialNumber}
                                        </CardTitle>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm btn-square"
                                        onClick={() => setModuleTarget(undefined)}
                                        aria-label="Close"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto pt-0">
                                    <ModuleSelector
                                        onSelectionChange={(selectedModules) => {
                                            setModuleDraft(selectedModules as Record<ModuleType, number>);
                                        }}
                                        initialCounts={moduleDraft}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 shrink-0 border-t border-base-300">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={submitModuleDraft}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm" />
                                                Saving…
                                            </>
                                        ) : (
                                            "Save modules"
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setModuleTarget(undefined)}
                                    >
                                        Cancel
                                    </button>
                                </CardFooter>
                            </Card>
                        </aside>
                    </>
                )}
            </div>
        </PageContainer>
    );
}
