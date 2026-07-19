import { useEffect, useState } from "react";
import { useRoundStore } from "../store/useRoundStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function ModuleNumberInput() {
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const currentModule = useRoundStore((state) => state.currentModule);
  const setModuleTwitchCode = useRoundStore((state) => state.setModuleTwitchCode);
  const [value, setValue] = useState(currentModule?.twitchCode ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(currentModule?.twitchCode ?? ""), [currentModule?.id, currentModule?.twitchCode]);
  if (!currentBomb || !currentModule) return null;

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      await setModuleTwitchCode(currentBomb.id, currentModule.id, value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save Twitch selector");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border bg-muted/20 px-4 py-3">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Twitch selector
        <Input
          value={value}
          maxLength={32}
          placeholder="e.g. 12"
          aria-label="Twitch selector"
          onChange={(event) => setValue(event.target.value.replace(/[^A-Za-z0-9]/g, ""))}
          onKeyDown={(event) => { if (event.key === "Enter") void save(); }}
          className="h-8 w-32 font-mono"
        />
      </label>
      <Button type="button" variant="outline" size="sm" onClick={() => void save()} disabled={saving || value === (currentModule.twitchCode ?? "")}>
        {saving ? "Saving…" : "Save"}
      </Button>
      <span className="pb-1 text-xs text-muted-foreground">
        {currentModule.twitchCode ? `Commands start with !${currentModule.twitchCode}` : "Required only for Twitch Plays"}
      </span>
      {error && <p className="w-full text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}
