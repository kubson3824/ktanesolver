import { Suspense, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { BombEntity, ModuleEntity } from "../types";
import { formatModuleDisplayName } from "../lib/utils";
import { Button } from "./ui/button";
import { lazySolverRegistry } from "./solvers/registry";

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

        const SolverComponent = lazySolverRegistry[selectedModule.type] ?? null;
        if (!SolverComponent) {
            return (
                <div className="text-center py-12">
                    <p className="text-sm text-secondary mb-2">Coming soon</p>
                    <p className="text-base-content/70">
                        This needy module solver is not yet implemented.
                    </p>
                </div>
            );
        }

        return (
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-12 gap-2">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                        <span className="text-sm text-base-content/70">Loading solver...</span>
                    </div>
                }
            >
                <SolverComponent bomb={bomb} />
            </Suspense>
        );
    };

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={onToggle}
                aria-label={isOpen ? "Close needy modules panel" : "Open needy modules panel"}
                aria-expanded={isOpen}
                className={`fixed top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-content text-xs font-semibold px-2 py-3 rounded-l-sm border border-primary ${
                    isOpen ? "right-80" : "right-0"
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
                className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-80 bg-white border-l-2 border-base-content shadow-card z-40 transform transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-base-200 border-b border-base-300 px-4 py-3 flex items-center justify-between">
                        <h2 className="section-heading" id="needy-panel-title">Needy Modules</h2>
                        <Button
                            ref={closeButtonRef}
                            variant="ghost"
                            size="xs"
                            onClick={onToggle}
                            aria-label="Close needy modules panel"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {!selectedModule ? (
                            <div className="h-full overflow-y-auto p-3 space-y-3">
                                {needyModules.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-sm text-ink-muted">No needy modules on this bomb.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2" role="list" aria-label="Needy modules list">
                                        {needyModules.map((module) => {
                                            const displayName = formatModuleDisplayName(module.type, module.id);
                                            return (
                                            <div
                                                key={module.id}
                                                role="listitem"
                                                className="bg-white border border-base-300 rounded-sm p-3 hover:border-primary transition-colors cursor-pointer"
                                                onClick={() => handleModuleClick(module)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") handleModuleClick(module);
                                                }}
                                                tabIndex={0}
                                                aria-label={`${displayName} — Click to open solver`}
                                            >
                                                <h3 className="font-semibold text-sm text-base-content">{displayName}</h3>
                                                <p className="text-xs text-ink-muted mt-0.5">Click to open solver</p>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {/* Module header */}
                                <div className="bg-base-200 border-b border-base-300 px-4 py-3 flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={handleBack}
                                        aria-label="Back to needy modules list"
                                    >
                                        &#9664;
                                    </Button>
                                    <h3 className="font-semibold text-sm text-base-content">
                                        {formatModuleDisplayName(selectedModule.type, selectedModule.id)}
                                    </h3>
                                </div>

                                {/* Module solver */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
