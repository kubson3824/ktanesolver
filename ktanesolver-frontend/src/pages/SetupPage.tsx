import {type FormEvent, useRef, useState, useCallback, useEffect} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {useRoundStore} from "../store/useRoundStore";
import {
    type BombEntity,
    PortType,
    RoundStatus,
} from "../types";
import BombCard from "../features/setup/BombCard";
import SetupModuleManifest from "../features/setup/SetupModuleManifest";
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
    DialogClose,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import PortIcon from "../components/PortIcon";
import { portColor, portLabel } from "../lib/ports";
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

function BatteryGlyph({ kind }: { kind: "AA" | "D" }) {
    return kind === "AA" ? (
        <svg viewBox="0 0 32 14" className="h-3.5 w-auto" aria-hidden>
            <rect x="1" y="1" width="26" height="12" rx="2" fill="#2E333B" stroke="#5A6270" />
            <rect x="19" y="1" width="8" height="12" rx="2" fill="#C98737" />
            <rect x="27" y="4.5" width="4" height="5" rx="1" fill="#9AA3AD" />
        </svg>
    ) : (
        <svg viewBox="0 0 26 18" className="h-[18px] w-auto" aria-hidden>
            <rect x="1" y="1" width="20" height="16" rx="2" fill="#2E333B" stroke="#5A6270" />
            <rect x="14" y="1" width="7" height="16" rx="2" fill="#C98737" />
            <rect x="21" y="5.5" width="4" height="7" rx="1" fill="#9AA3AD" />
        </svg>
    );
}

function BatteryCounter({ label, kind, value, step, onChange }: {
    label: string;
    kind: "AA" | "D";
    value: number;
    step: number;
    onChange: (next: number) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
            <div className="flex items-stretch h-11 rounded-lg border border-input bg-background overflow-hidden">
                <button
                    type="button"
                    className="w-10 text-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    onClick={() => onChange(Math.max(0, value - step))}
                    disabled={value <= 0}
                    aria-label={`Remove ${step} ${label}`}
                >
                    −
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 border-x border-input bg-muted/40">
                    <BatteryGlyph kind={kind} />
                    <span className="font-mono text-[15px] font-semibold tabular-nums">{value}</span>
                </div>
                <button
                    type="button"
                    className="w-10 text-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => onChange(value + step)}
                    aria-label={`Add ${step} ${label}`}
                >
                    +
                </button>
            </div>
        </div>
    );
}

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
    const removeModule = useRoundStore((state) => state.removeModule);
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
    const [moduleDraft, setModuleDraft] = useState<Record<string, number>>({});
    const [formStep, setFormStep] = useState(0);
    const stompClientRef = useRef<Client | null>(null);

    const isEditing = Boolean(editingBomb);
    const canStartRound = round && round.bombs.length > 0;

    // Edit mode never touches modules, so it drops the Modules step
    const stepLabels = isEditing
        ? ["Basics", "Indicators", "Port Plates"]
        : ["Basics", "Indicators", "Port Plates", "Modules"];
    const stepCount = stepLabels.length;

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
        setFormStep(0);
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
        setFormStep(0);
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
        // Enter on an intermediate step advances instead of submitting
        if (formStep < stepCount - 1) {
            setFormStep(formStep + 1);
            return;
        }
        if (!formState.serialNumber.trim()) {
            setFormStep(0);
            return;
        }
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
            Object.entries(formState.modules).filter(([, count]) => count > 0),
        );

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
                addModules(moduleTarget.id, {type, count}),
            ),
        );
        setModuleTarget(undefined);
    };

    const roundStatusLabel = round ? getRoundStatusLabel(round.status) : "No round";
    const canRemoveModules = round?.status === RoundStatus.SETUP;
    const activeModuleTarget = moduleTarget
        ? round?.bombs.find((bomb) => bomb.id === moduleTarget.id) ?? moduleTarget
        : undefined;

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

    const handleRemoveModule = async (moduleId: string) => {
        if (!activeModuleTarget || !canRemoveModules) return;
        const module = activeModuleTarget.modules.find((entry) => entry.id === moduleId);
        if (!module) return;

        const moduleName = module.type.toLowerCase().replaceAll("_", " ");
        if (!window.confirm(`Remove this ${moduleName} module from ${activeModuleTarget.serialNumber}?`)) {
            return;
        }

        await removeModule(activeModuleTarget.id, moduleId);
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
                    <DialogContent className="h-[100dvh] md:h-auto md:max-h-[90vh] max-w-none md:max-w-[720px] flex flex-col gap-0 p-0 rounded-none md:rounded-lg overflow-hidden">
                        <DialogHeader className="bg-muted border-b border-border px-5 py-3.5 flex flex-row items-center justify-between gap-4 space-y-0 shrink-0">
                            <DialogTitle className="text-base font-bold uppercase">
                                {isEditing ? "Edgework Adjustments" : "New Bomb Setup"}
                            </DialogTitle>
                            <DialogClose asChild>
                                <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Close
                                </button>
                            </DialogClose>
                        </DialogHeader>

                        {/* Step progress pills */}
                        <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-border shrink-0">
                            {stepLabels.map((label, index) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setFormStep(index)}
                                    className={cn(
                                        "h-[26px] px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.03em] transition-colors",
                                        index === formStep
                                            ? "bg-primary text-primary-foreground"
                                            : index < formStep
                                                ? "bg-[#2FA876] text-[#062017]"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleFormSubmit}>
                            <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
                                {formStep === 0 && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-xs text-muted-foreground">
                                            Step 1 of {stepCount} — enter the serial number and battery count from this bomb's edgework.
                                        </p>
                                        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                                            <label className="flex flex-col gap-1.5">
                                                <span className="text-[11px] uppercase text-muted-foreground">Serial number</span>
                                                <Input
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="e.g. AL5QT3"
                                                    className="h-11 rounded-lg px-2.5 text-[15px] font-mono tracking-widest"
                                                    value={formState.serialNumber}
                                                    onChange={(event) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            serialNumber: event.target.value.toUpperCase().slice(0, 6),
                                                        }))
                                                    }
                                                />
                                            </label>
                                            <BatteryCounter
                                                label="AA batteries"
                                                kind="AA"
                                                step={2}
                                                value={formState.aaBatteryCount}
                                                onChange={(next) =>
                                                    setFormState((prev) => ({ ...prev, aaBatteryCount: next }))
                                                }
                                            />
                                            <BatteryCounter
                                                label="D batteries"
                                                kind="D"
                                                step={1}
                                                value={formState.dBatteryCount}
                                                onChange={(next) =>
                                                    setFormState((prev) => ({ ...prev, dBatteryCount: next }))
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {formStep === 1 && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-xs text-muted-foreground">
                                            Step 2 of {stepCount} — add any indicators visible on the bomb's case.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                type="text"
                                                placeholder="Label"
                                                className="flex-1 min-w-[100px] h-10 rounded-lg px-2.5 text-sm"
                                                value={indicatorDraft.name}
                                                onChange={(event) =>
                                                    setIndicatorDraft((prev) => ({
                                                        ...prev,
                                                        name: event.target.value,
                                                    }))
                                                }
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        addIndicator();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className={cn(
                                                    "h-10 px-3.5 rounded-lg border bg-transparent text-[13px] transition-colors",
                                                    indicatorDraft.lit
                                                        ? "border-[#2FA876] text-[#2FA876]"
                                                        : "border-border text-foreground"
                                                )}
                                                onClick={() => setIndicatorDraft((p) => ({ ...p, lit: true }))}
                                            >
                                                Lit
                                            </button>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "h-10 px-3.5 rounded-lg border bg-transparent text-[13px] transition-colors",
                                                    !indicatorDraft.lit
                                                        ? "border-primary text-foreground"
                                                        : "border-border text-muted-foreground"
                                                )}
                                                onClick={() => setIndicatorDraft((p) => ({ ...p, lit: false }))}
                                            >
                                                Unlit
                                            </button>
                                            <button
                                                type="button"
                                                className="h-10 px-3.5 rounded-lg border border-border bg-background text-foreground text-[13px] hover:bg-muted transition-colors"
                                                onClick={addIndicator}
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formState.indicators.map((indicator) => (
                                                <span
                                                    key={indicator.id}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 py-[5px] pl-3 pr-1.5 rounded-full text-[13px]",
                                                        indicator.lit
                                                            ? "bg-[rgba(47,168,118,0.18)] text-[#1F8F63]"
                                                            : "bg-muted text-foreground"
                                                    )}
                                                >
                                                    {indicator.name}
                                                    <button
                                                        type="button"
                                                        className="h-6 w-6 text-[15px] leading-none hover:opacity-70 transition-opacity"
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
                                                </span>
                                            ))}
                                            {formState.indicators.length === 0 && (
                                                <span className="text-xs text-muted-foreground italic">No indicators yet.</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {formStep === 2 && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs text-muted-foreground">
                                                Step 3 of {stepCount} — add each port plate and tap the ports present on it.
                                            </p>
                                            <button
                                                type="button"
                                                className="h-[34px] px-3.5 rounded-lg border border-border bg-background text-foreground text-xs whitespace-nowrap hover:bg-muted transition-colors"
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
                                                + Add plate
                                            </button>
                                        </div>
                                        {formState.portPlates.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No plates configured.</p>
                                        )}
                                        <div className="flex flex-col">
                                            {formState.portPlates.map((plate, index) => (
                                                <div key={plate.id} className="flex flex-wrap items-center gap-2.5 py-2.5 border-b border-border">
                                                    <strong className="text-[11px] uppercase text-muted-foreground min-w-[52px]">
                                                        Plate {index + 1}
                                                    </strong>
                                                    <div className="flex flex-wrap gap-1 flex-1 min-w-[180px]">
                                                        {portTypes.map((port) => {
                                                            const selected = plate.ports.includes(port);
                                                            return (
                                                                <button
                                                                    key={port}
                                                                    type="button"
                                                                    aria-pressed={selected}
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-[11px] font-medium transition-colors",
                                                                        selected
                                                                            ? "text-foreground shadow-sm"
                                                                            : "border-border bg-transparent text-foreground hover:bg-muted"
                                                                    )}
                                                                    style={selected
                                                                        ? { borderColor: portColor(port), background: `${portColor(port)}1F` }
                                                                        : undefined}
                                                                    onClick={() => updatePlate(plate.id, port)}
                                                                >
                                                                    <PortIcon port={port} className="h-4 w-auto shrink-0" />
                                                                    {portLabel(port)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="h-[30px] w-[30px] text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                        onClick={() =>
                                                            setFormState((prev) => ({
                                                                ...prev,
                                                                portPlates: prev.portPlates.filter(
                                                                    (entry) => entry.id !== plate.id,
                                                                ),
                                                            }))
                                                        }
                                                        aria-label={`Remove plate ${index + 1}`}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formStep === 3 && !isEditing && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-xs text-muted-foreground">
                                            Step 4 of {stepCount} — pick every module on this bomb, with counts.
                                        </p>
                                        <ModuleSelector
                                            onSelectionChange={handleModuleSelectionChange}
                                            initialCounts={formState.modules}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="bg-muted border-t border-border px-5 py-3.5 flex items-center justify-between gap-2 shrink-0">
                                <div className="flex gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    {formStep > 0 && (
                                        <Button type="button" variant="outline" onClick={() => setFormStep((s) => s - 1)}>
                                            Back
                                        </Button>
                                    )}
                                </div>
                                {formStep === stepCount - 1 ? (
                                    // Distinct keys force a fresh DOM node: React otherwise reuses the
                                    // Next button's element, flips it to type="submit" mid-click, and the
                                    // browser's default click action submits the form — skipping this step.
                                    <Button
                                        key="save"
                                        type="submit"
                                        variant="default"
                                        disabled={loading}
                                        loading={loading}
                                    >
                                        {isEditing ? "Save changes" : "Save bomb"}
                                    </Button>
                                ) : (
                                    <Button
                                        key="next"
                                        type="button"
                                        variant="default"
                                        onClick={() => setFormStep((s) => Math.min(s + 1, stepCount - 1))}
                                    >
                                        Next →
                                    </Button>
                                )}
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Module drawer */}
                {activeModuleTarget && (
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
                                        Add modules to {activeModuleTarget.serialNumber}
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
                                <div className="space-y-4">
                                    <SetupModuleManifest
                                        modules={activeModuleTarget.modules}
                                        canRemove={canRemoveModules}
                                        onRemove={(moduleId) => {
                                            void handleRemoveModule(moduleId);
                                        }}
                                    />
                                    <div className="rounded-lg border border-border bg-muted p-4 space-y-4">
                                        <div>
                                            <h3 className="text-[15px] font-semibold text-foreground">Add more modules</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Queue up additional modules to append to this bomb.
                                            </p>
                                        </div>
                                        <ModuleSelector
                                            onSelectionChange={(selectedModules) => {
                                                setModuleDraft(selectedModules);
                                            }}
                                            initialCounts={moduleDraft}
                                        />
                                    </div>
                                </div>
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
