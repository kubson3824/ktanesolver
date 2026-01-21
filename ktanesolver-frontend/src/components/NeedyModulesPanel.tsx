import {useState} from "react";
import type {ModuleEntity} from "../types";
import KnobsSolver from "./solvers/KnobsSolver";
import CapacitorDischargeSolver from "./solvers/CapacitorDischargeSolver";
import VentingGasSolver from "./solvers/VentingGasSolver";

const formatModuleName = (type: string) =>
    type
        .toLowerCase()
        .split("_")
        .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
        .join(" ");

interface NeedyModulesPanelProps {
    needyModules: ModuleEntity[];
    bomb: any;
    roundId: string;
    bombId: string;
    isOpen: boolean;
    onToggle: () => void;
}

export default function NeedyModulesPanel({
                                              needyModules,
                                              bomb,
                                              roundId,
                                              bombId,
                                              isOpen,
                                              onToggle,
                                          }: NeedyModulesPanelProps) {
    const [selectedModule, setSelectedModule] = useState<ModuleEntity | null>(null);

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
                return <KnobsSolver bomb={bomb} roundId={roundId} bombId={bombId} moduleId={selectedModule.id}/>;
            case "CAPACITOR_DISCHARGE":
                return <CapacitorDischargeSolver/>;
            case "VENTING_GAS":
                return <VentingGasSolver/>;
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
                className={`fixed top-1/2 -translate-y-1/2 z-80 btn btn-primary btn-sm rounded-r-none rounded-l-lg ${
                    isOpen ? "right-96" : "right-0"
                } transition-all duration-300`}
            >
                {isOpen ? "▶" : "◀"}
            </button>

            {/* Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-96 bg-base-200 border-l border-base-300 shadow-2xl z-30 transform transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="card bg-base-100 border-b border-base-300 rounded-none">
                        <div className="card-body">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Needy Modules</h2>
                                <button onClick={onToggle} className="btn btn-ghost btn-sm btn-circle">
                                    ✕
                                </button>
                            </div>
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
                                    <div className="space-y-2">
                                        {needyModules.map((module) => (
                                            <div
                                                key={module.id}
                                                className="card bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer"
                                                onClick={() => handleModuleClick(module)}
                                            >
                                                <div className="card-body p-4">
                                                    <h3 className="font-medium">{formatModuleName(module.type)}</h3>
                                                    <p className="text-sm text-base-content/70">
                                                        Click to open solver
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {/* Module header */}
                                <div className="bg-base-100 border-b border-base-300 p-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleBack} className="btn btn-ghost btn-sm btn-circle">
                                            ◀
                                        </button>
                                        <h3 className="font-medium">
                                            {formatModuleName(selectedModule.type)}
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
