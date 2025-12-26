import { useRoundStore } from "../store/useRoundStore";

export default function ModuleNumberInput() {
  const moduleNumber = useRoundStore((state) => state.moduleNumber);
  const setModuleNumber = useRoundStore((state) => state.setModuleNumber);

  return (
    <div className="bg-base-200 rounded-lg p-3 mb-4">
      <label className="text-sm text-base-content/70 block mb-2">
        Module Number (for Twitch chat):
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="99"
          value={moduleNumber}
          onChange={(e) => setModuleNumber(parseInt(e.target.value) || 1)}
          className="w-20 px-2 py-1 bg-base-100 border border-base-300 rounded text-base-content focus:border-primary focus:outline-none"
        />
        <span className="text-sm text-base-content/60">
          Command will start with !{moduleNumber}
        </span>
      </div>
    </div>
  );
}
