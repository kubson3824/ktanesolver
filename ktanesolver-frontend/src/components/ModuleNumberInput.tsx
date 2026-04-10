import { useRoundStore } from "../store/useRoundStore";

export default function ModuleNumberInput() {
  const currentModule = useRoundStore((state) => state.currentModule);
  const getModuleNumber = useRoundStore((state) => state.getModuleNumber);
  const setModuleNumber = useRoundStore((state) => state.setModuleNumber);

  const moduleNumber = getModuleNumber(currentModule?.id);

  if (!currentModule) {
    return (
      <div className="bg-base-100 border border-base-300 rounded-sm px-3 py-2 mb-4">
        <p className="text-sm text-ink-muted">Select a module to set its Twitch number.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-sm px-3 py-2 mb-4">
      <label className="text-xs text-ink-muted uppercase tracking-widest block mb-2">
        Module Number (Twitch)
      </label>
      <div className="inline-flex items-center bg-base-100 border border-base-300 rounded-sm overflow-hidden">
        <button
          type="button"
          className="px-2 py-1 text-ink-muted hover:bg-base-200 hover:text-base-content transition-colors text-sm leading-none"
          onClick={() => setModuleNumber(currentModule.id, Math.max(1, moduleNumber - 1))}
          aria-label="Decrease module number"
        >
          −
        </button>
        <span className="px-3 py-1 text-sm font-mono font-medium text-base-content border-x border-base-300 min-w-[2.5rem] text-center">
          {moduleNumber}
        </span>
        <button
          type="button"
          className="px-2 py-1 text-ink-muted hover:bg-base-200 hover:text-base-content transition-colors text-sm leading-none"
          onClick={() => setModuleNumber(currentModule.id, Math.min(99, moduleNumber + 1))}
          aria-label="Increase module number"
        >
          +
        </button>
      </div>
      <span className="ml-3 text-xs text-ink-muted">
        Command starts with <span className="font-mono">!{moduleNumber}</span>
      </span>
    </div>
  );
}
