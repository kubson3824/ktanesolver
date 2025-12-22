import {type FormEvent, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useRoundStore} from "../store/useRoundStore";
import {
    type BombEntity,
    ModuleType,
    PortType,
    RoundStatus,
} from "../types";

type IndicatorInput = {
    id: string;
    name: string;
    lit: boolean;
};

type PlateInput = {
    id: string;
    ports: PortType[];
};

type ModuleInput = {
    type: ModuleType;
    count: number;
};

type BombFormState = {
    serialNumber: string;
    aaBatteryCount: number;
    dBatteryCount: number;
    indicators: IndicatorInput[];
    portPlates: PlateInput[];
    modules: ModuleInput[];
};

const moduleTypes = Object.values(ModuleType);
const portTypes = Object.values(PortType);

const initialFormState = (): BombFormState => ({
    serialNumber: "",
    aaBatteryCount: 0,
    dBatteryCount: 0,
    indicators: [],
    portPlates: [],
    modules: moduleTypes.map((type) => ({type, count: 0})),
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
    const [moduleDraft, setModuleDraft] = useState<Record<ModuleType, number>>(
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
            modules: moduleTypes.map((type) => {
                const count =
                    bomb.modules?.filter((module) => module.type === type).length ?? 0;
                return {type, count};
            }),
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

    const bumpModule = (type: ModuleType, delta: number) => {
        setFormState((prev) => ({
            ...prev,
            modules: prev.modules.map((entry) =>
                entry.type === type
                    ? {...entry, count: Math.max(0, entry.count + delta)}
                    : entry,
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
        const moduleEntries = formState.modules.filter((entry) => entry.count > 0);
        if (moduleEntries.length > 0) {
            await Promise.all(
                moduleEntries.map((entry) =>
                    addModules(newBomb.id, {type: entry.type, count: entry.count}),
                ),
            );
        }
        setIsFormOpen(false);
        setFormState(initialFormState());
    };

    const openModulePanel = (bomb: BombEntity) => {
        setModuleTarget(bomb);
        setModuleDraft(
            moduleTypes.reduce((acc, type) => {
                acc[type] = 0;
                return acc;
            }, {} as Record<ModuleType, number>),
        );
    };

    const submitModuleDraft = async () => {
        if (!moduleTarget) return;
        const entries = Object.entries(moduleDraft).filter(
            ([, count]) => count > 0,
        ) as [ModuleType, number][];
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

    const handleStartRound = async () => {
        if (!round) return;
        const updated = await startRound();
        navigate(`/solve/${updated.id}`);
    };

    return (
        <div className="app-shell">
            <div className="shell-content grid">
                <section className="panel hero">
                    <div className="hero-content">
                        <div className="hero-text">
                            <p className="eyebrow">Round preparation</p>
                            <h1>Build your bomb roster</h1>
                            <p className="hero-subtitle">
                                Capture edgework, curate modules, and hand off the binder to the
                                expert team before the timer even starts ticking.
                            </p>
                            <div className="hero-actions">
                                <button
                                    className="action-primary"
                                    onClick={openCreateForm}
                                    disabled={loading}
                                >
                                    Add Bomb
                                </button>
                                {round && (
                                    <span className="tag">
                    Round status:&nbsp;
                                        <strong>{roundStatusLabel}</strong>
                  </span>
                                )}
                            </div>
                        </div>
                        <div className="hero-board">
                            <div className="hero-stat">
                                <span>Total bombs</span>
                                <strong>{round?.bombs.length ?? 0}</strong>
                            </div>
                            <div className="hero-stat">
                                <span>Modules queued</span>
                                <strong>
                                    {round?.bombs.reduce(
                                        (sum, bomb) => sum + (bomb.modules?.length ?? 0),
                                        0,
                                    ) ?? 0}
                                </strong>
                            </div>
                            <div className="hero-stat accent">
                                <span>Ready checks</span>
                                <strong>{canStartRound ? "All green" : "Pending"}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {error && <div className="error-banner panel">{error}</div>}

                <section className="panel bombs-panel">
                    <header className="panel-header">
                        <div>
                            <p className="eyebrow">Current round</p>
                            <h2>Bomb manifest</h2>
                        </div>
                        <div className="panel-actions">
                            <button
                                className="ghost-button"
                                onClick={openCreateForm}
                                disabled={loading}
                            >
                                Add Bomb
                            </button>
                            <button
                                className="action-primary"
                                disabled={!canStartRound || loading}
                                onClick={handleStartRound}
                            >
                                Start Round
                            </button>
                        </div>
                    </header>

                    {round?.bombs.length ? (
                        <div className="bomb-grid">
                            {round.bombs.map((bomb) => (
                                <article key={bomb.id} className="bomb-card">
                                    <div className="bomb-card-header">
                                        <div>
                                            <p className="eyebrow">Serial</p>
                                            <h3>{bomb.serialNumber || "Unknown"}</h3>
                                        </div>
                                        <span className="tag">{bomb.status}</span>
                                    </div>
                                    <dl className="bomb-meta">
                                        <div>
                                            <dt>AA / D batteries</dt>
                                            <dd>
                                                {bomb.aaBatteryCount} / {bomb.dBatteryCount}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Indicators</dt>
                                            <dd>
                                                {Object.entries(bomb.indicators ?? {}).map(
                                                    ([name, lit]) => (
                                                        <span
                                                            key={`${bomb.id}-${name}`}
                                                            className={`indicator-chip ${
                                                                lit ? "lit" : "unlit"
                                                            }`}
                                                        >
                              {name}
                            </span>
                                                    ),
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Port plates</dt>
                                            <dd>
                                                {bomb.portPlates.length === 0
                                                    ? "—"
                                                    : bomb.portPlates
                                                        .map((plate, index) => {
                                                            const ports = plate.ports.join(", ");
                                                            return `Plate ${index + 1}: ${ports || "Empty"}`;
                                                        })
                                                        .join(" • ")}
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="modules-summary">
                                        {moduleTypes.map((type) => {
                                            const count =
                                                bomb.modules?.filter((module) => module.type === type)
                                                    .length ?? 0;
                                            if (count === 0) return null;
                                            return (
                                                <span key={type} className="module-chip">
                          {type.replaceAll("_", " ")} ({count})
                        </span>
                                            );
                                        })}
                                        {bomb.modules.length === 0 && (
                                            <p className="empty-state">No modules yet</p>
                                        )}
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="ghost-button"
                                            onClick={() => openEditForm(bomb)}
                                        >
                                            Adjust edgework
                                        </button>
                                        <button
                                            className="action-primary"
                                            onClick={() => openModulePanel(bomb)}
                                        >
                                            Add modules
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No bombs configured yet. Start by adding edgework.</p>
                        </div>
                    )}
                </section>

                {isFormOpen && (
                    <section className="panel form-panel">
                        <header className="panel-header">
                            <div>
                                <p className="eyebrow">
                                    {isEditing ? "Update" : "Configure"} bomb
                                </p>
                                <h2>{isEditing ? "Edgework adjustments" : "New bomb setup"}</h2>
                            </div>
                            <button className="ghost-button" onClick={() => setIsFormOpen(false)}>
                                Close
                            </button>
                        </header>

                        <form className="form-grid" onSubmit={handleFormSubmit}>
                            <div className="two-column">
                                <label className="form-field">
                                    <span>Serial number</span>
                                    <input
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
                                <div className="battery-grid">
                                    <label className="form-field">
                                        <span>AA batteries</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formState.aaBatteryCount}
                                            onChange={(event) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    aaBatteryCount: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </label>
                                    <label className="form-field">
                                        <span>D batteries</span>
                                        <input
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

                            <div className="form-section">
                                <div className="section-header">
                                    <h3>Indicators</h3>
                                    <div className="indicator-inputs">
                                        <input
                                            type="text"
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
                                            className="ghost-button"
                                            onClick={addIndicator}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                                <div className="indicator-list">
                                    {formState.indicators.map((indicator) => (
                                        <span
                                            key={indicator.id}
                                            className={`indicator-chip ${indicator.lit ? "lit" : "unlit"}`}
                                        >
                      {indicator.name}
                                            <button
                                                type="button"
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
                                        <p className="empty-state">No indicators yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-header">
                                    <h3>Port plates</h3>
                                    <button
                                        type="button"
                                        className="ghost-button"
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
                                <div className="port-plates-list">
                                    {formState.portPlates.length === 0 && (
                                        <p className="empty-state">No plates configured.</p>
                                    )}
                                    {formState.portPlates.map((plate, index) => (
                                        <div key={plate.id} className="port-plate">
                                            <header>
                                                <strong>Plate {index + 1}</strong>
                                                <button
                                                    type="button"
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
                                            </header>
                                            <div className="port-grid">
                                                {portTypes.map((port) => (
                                                    <label key={port} className="port-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={plate.ports.includes(port)}
                                                            onChange={() => updatePlate(plate.id, port)}
                                                        />
                                                        {port}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="form-section">
                                    <div className="section-header">
                                        <h3>Modules for this bomb</h3>
                                    </div>
                                    <div className="module-grid">
                                        {formState.modules.map((entry) => (
                                            <div key={entry.type} className="module-card">
                                                <span>{entry.type.replaceAll("_", " ")}</span>
                                                <div className="module-counter">
                                                    <button
                                                        type="button"
                                                        onClick={() => bumpModule(entry.type, -1)}
                                                    >
                                                        −
                                                    </button>
                                                    <strong>{entry.count}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => bumpModule(entry.type, 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="action-primary"
                                    disabled={loading}
                                >
                                    {isEditing ? "Save changes" : "Save bomb"}
                                </button>
                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {moduleTarget && (
                    <section className="panel form-panel">
                        <header className="panel-header">
                            <div>
                                <p className="eyebrow">Module injection</p>
                                <h2>Add modules to {moduleTarget.serialNumber}</h2>
                            </div>
                            <button
                                className="ghost-button"
                                onClick={() => setModuleTarget(undefined)}
                            >
                                Close
                            </button>
                        </header>
                        <div className="module-grid">
                            {moduleTypes.map((type) => (
                                <div key={type} className="module-card">
                                    <span>{type.replaceAll("_", " ")}</span>
                                    <div className="module-counter">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setModuleDraft((prev) => ({
                                                    ...prev,
                                                    [type]: Math.max(0, prev[type] - 1),
                                                }))
                                            }
                                        >
                                            −
                                        </button>
                                        <strong>{moduleDraft[type]}</strong>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setModuleDraft((prev) => ({
                                                    ...prev,
                                                    [type]: prev[type] + 1,
                                                }))
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="form-actions">
                            <button
                                className="action-primary"
                                onClick={submitModuleDraft}
                                disabled={loading}
                            >
                                Save modules
                            </button>
                            <button
                                className="ghost-button"
                                onClick={() => setModuleTarget(undefined)}
                            >
                                Cancel
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
