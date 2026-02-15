import { useRoundStore } from "../store/useRoundStore";

export default function ModuleNumberInput() {
  const currentModule = useRoundStore((state) => state.currentModule);
  const getModuleNumber = useRoundStore((state) => state.getModuleNumber);
  const setModuleNumber = useRoundStore((state) => state.setModuleNumber);

  const moduleNumber = getModuleNumber(currentModule?.id);

  if (!currentModule) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-200/80 p-4 mb-4">
        <p className="text-sm text-base-content/60">Select a module to set its Twitch number.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-base-300 bg-base-200/80 p-4 mb-4">
      <label className="text-sm text-base-content/70 block mb-2">
        Module Number (for Twitch chat):
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="99"
          value={moduleNumber}
          onChange={(e) => setModuleNumber(currentModule.id, parseInt(e.target.value) || 1)}
          className="w-20 px-2 py-1.5 bg-base-100 border border-base-300 rounded text-base-content focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
        <span className="text-sm text-base-content/60">
          Command will start with !{moduleNumber}
        </span>
      </div>
    </div>
  );
}
