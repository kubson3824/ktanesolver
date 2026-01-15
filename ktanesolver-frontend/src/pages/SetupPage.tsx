import {type FormEvent, useMemo, useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {useRoundStore} from "../store/useRoundStore";
import {
    type BombEntity,
    ModuleType,
    PortType,
    RoundStatus,
} from "../types";
import ModuleSelector from "../components/ModuleSelector";

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

    const roundStatusLabel = useMemo(() => {
        if (!round) return "No round";
        switch (round.status) {
            case RoundStatus.SETUP:
                return "Setup";
            case RoundStatus.ACTIVE:
                return "Active";
            case RoundStatus.COMPLETED:
                return "Completed";
            case RoundStatus.FAILED:
                return "Failed";
            default:
                return "Unknown";
        }
    }, [round]);

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
        <div className="min-h-screen p-10 lg:p-16">
            <div className="max-w-7xl mx-auto grid gap-5">
                <section className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
                    <div className="card-body">
                        <div className="flex flex-col lg:flex-row gap-8 items-center">
                            <div className="flex-1">
                                <p className="text-sm text-secondary font-medium uppercase tracking-wider">Round preparation</p>
                                <h1 className="text-4xl font-bold mt-2 mb-4">Build your bomb roster</h1>
                                <p className="text-base-content/70 mb-6">
                                    Capture edgework, curate modules, and hand off the binder to the
                                    expert team before the timer even starts ticking.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        className="btn btn-primary"
                                        onClick={openCreateForm}
                                        disabled={loading}
                                    >
                                        Add Bomb
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => navigate("/rounds")}
                                    >
                                        View All Rounds
                                    </button>
                                    {round && (
                                        <span className="badge badge-outline gap-2">
                    Round status:&nbsp;
                                        <strong>{roundStatusLabel}</strong>
                  </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="stat">
                                    <span className="stat-title text-secondary">Total bombs</span>
                                    <div className="stat-value text-3xl font-bold">{round?.bombs.length ?? 0}</div>
                                </div>
                                <div className="stat">
                                    <span className="stat-title text-secondary">Modules queued</span>
                                    <div className="stat-value text-3xl font-bold">
                                        {round?.bombs.reduce(
                                            (sum, bomb) => sum + (bomb.modules?.length ?? 0),
                                            0,
                                        ) ?? 0}
                                    </div>
                                </div>
                                <div className="stat">
                                    <span className="stat-title text-secondary">Ready checks</span>
                                    <div className={`stat-value text-3xl font-bold ${canStartRound ? "text-success" : "text-warning"}`}>
                                        {canStartRound ? "All green" : "Pending"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {error && <div className="alert alert-error mb-5">Error: {error}</div>}

                <section className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
                    <div className="card-body">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-sm text-secondary font-medium uppercase tracking-wider">Current round</p>
                                <h2 className="text-2xl font-bold mt-1">Bomb manifest</h2>
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
                        </div>

                        {round?.bombs.length ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {round.bombs.map((bomb) => (
                                    <div key={bomb.id} className="card bg-base-100 border border-base-300">
                                        <div className="card-body">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs text-secondary uppercase tracking-wider">Serial</p>
                                                    <h3 className="card-title text-lg">{bomb.serialNumber || "Unknown"}</h3>
                                                </div>
                                                <span className="badge badge-outline">{bomb.status}</span>
                                            </div>
                                            <div className="space-y-3 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-secondary">AA / D batteries</span>
                                                    <span className="font-mono font-bold">
                                                        {bomb.aaBatteryCount} / {bomb.dBatteryCount}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-secondary block mb-2">Indicators</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(bomb.indicators ?? {}).map(
                                                            ([name, lit]) => (
                                                                <span
                                                                    key={`${bomb.id}-${name}`}
                                                                    className={`badge ${
                                                                        lit ? "badge-success" : "badge-neutral"
                                                                    } badge-sm`}
                                                                >
                              {name}
                            </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-secondary block mb-2">Port plates</span>
                                                    <span className="text-xs">
                                                        {bomb.portPlates.length === 0
                                                            ? "—"
                                                            : bomb.portPlates
                                                                .map((plate, index) => {
                                                                    const ports = plate.ports.join(", ");
                                                                    return `Plate ${index + 1}: ${ports || "Empty"}`;
                                                                })
                                                                .join(" • ")}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="divider my-2"></div>
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {moduleTypes.map((type) => {
                                                    const count =
                                                        bomb.modules?.filter((module) => module.type === type)
                                                            .length ?? 0;
                                                    if (count === 0) return null;
                                                    return (
                                                        <span key={type} className="badge badge-info badge-sm">
                          {type.replaceAll("_", " ")} ({count})
                        </span>
                                                    );
                                                })}
                                                {bomb.modules.length === 0 && (
                                                    <p className="text-sm text-base-content/50 italic">No modules yet</p>
                                                )}
                                            </div>
                                            <div className="card-actions justify-end gap-2">
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openEditForm(bomb)}
                                                >
                                                    Adjust edgework
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => openModulePanel(bomb)}
                                                >
                                                    Add modules
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-base-content/70">No bombs configured yet. Start by adding edgework.</p>
                            </div>
                        )}
                    </div>
                </section>

                {isFormOpen && (
                    <section className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
                        <div className="card-body">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-sm text-secondary font-medium uppercase tracking-wider">
                                        {isEditing ? "Update" : "Configure"} bomb
                                    </p>
                                    <h2 className="text-2xl font-bold mt-1">{isEditing ? "Edgework adjustments" : "New bomb setup"}</h2>
                                </div>
                                <button className="btn btn-outline btn-sm" onClick={() => setIsFormOpen(false)}>
                                    Close
                                </button>
                            </div>

                            <form className="space-y-6" onSubmit={handleFormSubmit}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="form-control w-full">
                                        <span className="label-text">Serial number</span>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
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
                                        <label className="form-control w-full">
                                            <span className="label-text">AA batteries</span>
                                            <input
                                                type="number"
                                                step={2}
                                                min={0}
                                                className="input input-bordered w-full"
                                                value={formState.aaBatteryCount}
                                                onChange={(event) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        aaBatteryCount: Number(event.target.value),
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="form-control w-full">
                                            <span className="label-text">D batteries</span>
                                            <input
                                                type="number"
                                                min={0}
                                                className="input input-bordered w-full"
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

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">Indicators</h3>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="input input-bordered input-sm"
                                                placeholder="Label"
                                                value={indicatorDraft.name}
                                                onChange={(event) =>
                                                    setIndicatorDraft((prev) => ({
                                                        ...prev,
                                                        name: event.target.value,
                                                    }))
                                                }
                                            />
                                            <select
                                                className="select select-bordered select-sm"
                                                value={indicatorDraft.lit ? "lit" : "unlit"}
                                                onChange={(event) =>
                                                    setIndicatorDraft((prev) => ({
                                                        ...prev,
                                                        lit: event.target.value === "lit",
                                                    }))
                                                }
                                            >
                                                <option value="lit">Lit</option>
                                                <option value="unlit">Unlit</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={addIndicator}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formState.indicators.map((indicator) => (
                                            <span
                                                key={indicator.id}
                                                className={`badge ${
                                                    indicator.lit ? "badge-success" : "badge-neutral"
                                                } gap-2`}
                                            >
                      {indicator.name}
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs p-0 h-4 min-h-4"
                                                onClick={() =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        indicators: prev.indicators.filter(
                                                            (entry) => entry.id !== indicator.id,
                                                        ),
                                                    }))
                                                }
                                            >
                        ×
                      </button>
                    </span>
                                        ))}
                                        {formState.indicators.length === 0 && (
                                            <p className="text-sm text-base-content/50 italic">No indicators yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">Port plates</h3>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
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
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {formState.portPlates.length === 0 && (
                                            <p className="text-sm text-base-content/50 italic">No plates configured.</p>
                                        )}
                                        {formState.portPlates.map((plate, index) => (
                                            <div key={plate.id} className="card bg-base-100 border border-base-300">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <strong className="text-sm">Plate {index + 1}</strong>
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-xs"
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
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {portTypes.map((port) => (
                                                            <label key={port} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="checkbox checkbox-sm"
                                                                    checked={plate.ports.includes(port)}
                                                                    onChange={() => updatePlate(plate.id, port)}
                                                                />
                                                                <span className="text-sm">{port}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Modules for this bomb</h3>
                                        <ModuleSelector
                                            onSelectionChange={handleModuleSelectionChange}
                                            initialCounts={formState.modules}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {isEditing ? "Save changes" : "Save bomb"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setIsFormOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                )}

                {moduleTarget && (
                    <section className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
                        <div className="card-body">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-sm text-secondary font-medium uppercase tracking-wider">Module injection</p>
                                    <h2 className="text-2xl font-bold mt-1">Add modules to {moduleTarget.serialNumber}</h2>
                                </div>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setModuleTarget(undefined)}
                                >
                                    Close
                                </button>
                            </div>
                            <ModuleSelector
                                onSelectionChange={(selectedModules) => {
                                    setModuleDraft(selectedModules as Record<ModuleType, number>);
                                }}
                                initialCounts={moduleDraft}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={submitModuleDraft}
                                    disabled={loading}
                                >
                                    Save modules
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setModuleTarget(undefined)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
