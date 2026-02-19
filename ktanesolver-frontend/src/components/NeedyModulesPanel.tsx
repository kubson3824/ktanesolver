import { useEffect, useRef, useState } from "react";
import type { BombEntity, ModuleEntity } from "../types";
import KnobsSolver from "./solvers/KnobsSolver";
import CapacitorDischargeSolver from "./solvers/CapacitorDischargeSolver";
import VentingGasSolver from "./solvers/VentingGasSolver";
import { formatModuleDisplayName } from "../lib/utils";

interface NeedyModulesPanelProps {
    needyModules: ModuleEntity[];
    bomb: BombEntity | null | undefined;
    roundId: string;
    bombId: string;
    isOpen: boolean;
    onToggle: () => void;
}

export default function NeedyModulesPanel({
    needyModules,
    bomb,
    roundId: _roundId,
    bombId: _bombId,
    isOpen,
    onToggle,
}: NeedyModulesPanelProps) {
    // roundId and bombId kept in props for future needy solvers that need them
    void _roundId;
    void _bombId;
    const [selectedModule, setSelectedModule] = useState<ModuleEntity | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus trap: focus close button when panel opens
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onToggle();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onToggle]);

    const handleModuleClick = (module: ModuleEntity) => {
        setSelectedModule(module);
    };

    const handleBack = () => {
        setSelectedModule(null);
    };

    const renderModuleSolver = () => {
        if (!selectedModule) return null;

        switch (selectedModule.type) {
            case "KNOBS":
                return <KnobsSolver bomb={bomb} />;
            case "CAPACITOR_DISCHARGE":
                return <CapacitorDischargeSolver />;
            case "VENTING_GAS":
                return <VentingGasSolver />;
            default:
                return (
                    <div className="text-center py-12">
                        <p className="text-sm text-secondary mb-2">Coming soon</p>
                        <p className="text-base-content/70">
                            This needy module solver is not yet implemented.
                        </p>
                    </div>
                );
        }
    };

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={onToggle}
                aria-label={isOpen ? "Close needy modules panel" : "Open needy modules panel"}
                aria-expanded={isOpen}
                className={`fixed top-1/2 -translate-y-1/2 z-40 btn btn-primary btn-sm rounded-r-none rounded-l-lg ${
                    isOpen ? "right-96" : "right-0"
                } transition-all duration-300`}
            >
                {isOpen ? "\u25B6" : "\u25C0"}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 sm:hidden"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}

            {/* Panel */}
            <div
                ref={panelRef}
                role="dialog"
                aria-label="Needy Modules"
                aria-modal="true"
                className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-base-200 border-l border-base-300 shadow-2xl z-40 transform transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-base-100 border-b border-base-300 p-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold" id="needy-panel-title">Needy Modules</h2>
                            <button
                                ref={closeButtonRef}
                                onClick={onToggle}
                                className="btn btn-ghost btn-sm btn-circle"
                                aria-label="Close needy modules panel"
                            >
                                \u2715
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {!selectedModule ? (
                            <div className="h-full overflow-y-auto p-4">
                                {needyModules.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-base-content/50">No needy modules on this bomb.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2" role="list" aria-label="Needy modules list">
                                        {needyModules.map((module) => {
                                            const displayName = formatModuleDisplayName(module.type, module.id);
                                            return (
                                            <div
                                                key={module.id}
                                                role="listitem"
                                                className="card bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer"
                                                onClick={() => handleModuleClick(module)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") handleModuleClick(module);
                                                }}
                                                tabIndex={0}
                                                aria-label={`${displayName} — Click to open solver`}
                                            >
                                                <div className="card-body p-4">
                                                    <h3 className="font-medium">{displayName}</h3>
                                                    <p className="text-sm text-base-content/70">Click to open solver</p>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {/* Module header */}
                                <div className="bg-base-100 border-b border-base-300 p-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBack}
                                            className="btn btn-ghost btn-sm btn-circle"
                                            aria-label="Back to needy modules list"
                                        >
                                            \u25C0
                                        </button>
                                        <h3 className="font-medium">
                                    {formatModuleDisplayName(selectedModule.type, selectedModule.id)}
                                </h3>
                                    </div>
                                </div>

                                {/* Module solver */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {renderModuleSolver()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
