import { useCallback, useMemo, useState } from "react";
import { solveGadgetronVendor, type GadgetronVendorOutput } from "../../services/gadgetronVendorService";
import { useRoundStore } from "../../store/useRoundStore";
import { type BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, useSolver, useSolverModulePersistence } from "../common";

const WEAPONS = ["Blaster", "Bomb Glove", "Decoy Glove", "Devastator", "Drone Device", "Glove of Doom", "Mine Glove", "Morph-O-Ray", "Pyrocitor", "R.Y.N.O.", "Suck Cannon", "Taunter", "Tesla Claw", "Visibomb", "Walloper"];
export default function GadgetronVendorSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [bolts, setBolts] = useState(20000), [currentWeapon, setCurrentWeapon] = useState(WEAPONS[0]), [currentAmmo, setCurrentAmmo] = useState(0), [maximumAmmo, setMaximumAmmo] = useState(0), [weaponForSale, setWeaponForSale] = useState(WEAPONS[1]), [pdaLit, setPdaLit] = useState(false), [result, setResult] = useState<GadgetronVendorOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ bolts, currentWeapon, currentAmmo, maximumAmmo, weaponForSale, pdaLit, result }), [bolts, currentWeapon, currentAmmo, maximumAmmo, weaponForSale, pdaLit, result]);
  useSolverModulePersistence<typeof state, GadgetronVendorOutput>({ state, onRestoreState: useCallback(saved => { if (saved.bolts !== undefined) setBolts(saved.bolts); if (saved.currentWeapon) setCurrentWeapon(saved.currentWeapon); if (saved.currentAmmo !== undefined) setCurrentAmmo(saved.currentAmmo); if (saved.maximumAmmo !== undefined) setMaximumAmmo(saved.maximumAmmo); if (saved.weaponForSale) setWeaponForSale(saved.weaponForSale); if (saved.pdaLit !== undefined) setPdaLit(saved.pdaLit); if (saved.result) setResult(saved.result); }, []), onRestoreSolution: useCallback((solution: GadgetronVendorOutput) => setResult(solution), []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGadgetronVendor(round.id, bomb.id, currentModule.id, { bolts, currentWeapon, currentAmmo, maximumAmmo, weaponForSale, pdaLit });
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { bolts, currentWeapon, currentAmmo, maximumAmmo, weaponForSale, pdaLit, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Gadgetron Vendor"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setBolts(20000); setCurrentWeapon(WEAPONS[0]); setCurrentAmmo(0); setMaximumAmmo(0); setWeaponForSale(WEAPONS[1]); setPdaLit(false); setResult(null); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Vendor displays"><div className="grid gap-3 sm:grid-cols-2"><label>Bolts<input aria-label="Bolt count" type="number" min={0} value={bolts} onChange={event => { setBolts(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label><label>Current weapon<select aria-label="Current weapon" value={currentWeapon} onChange={event => { setCurrentWeapon(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{WEAPONS.map(weapon => <option key={weapon}>{weapon}</option>)}</select></label><label>Current ammo<input aria-label="Current ammo" type="number" min={0} value={currentAmmo} onChange={event => { setCurrentAmmo(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label><label>Maximum ammo<input aria-label="Maximum ammo" type="number" min={0} value={maximumAmmo} onChange={event => { setMaximumAmmo(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label><label>Weapon for sale<select aria-label="Weapon for sale" value={weaponForSale} onChange={event => { setWeaponForSale(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{WEAPONS.map(weapon => <option key={weapon}>{weapon}</option>)}</select></label><label className="flex items-center gap-2 pt-7"><input type="checkbox" checked={pdaLit} onChange={event => { setPdaLit(event.target.checked); changed(); }} />PDA icon is lit green</label></div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate bolt balance" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit this amount" className="border-emerald-500/40"><p className="font-mono text-5xl font-bold">{String(result.answer).padStart(4, "0")}</p><div className="mt-3 text-sm text-muted-foreground"><p>Ammo: {result.ammoUnitPrice} each; full refill costs {result.refillCost}; {result.boltsAfterRefill} bolts remain.</p><p>{result.canBuyWeapon ? `Buy the sale weapon for ${result.weaponPrice} bolts.` : `Skip the ${result.weaponPrice}-bolt sale weapon because it is unaffordable.`}</p></div></SolverSection>}
    <SolverInstructions>Adjust the four digit places with the module’s arrow buttons and press the red submit button. The published source has no Twitch Plays command parser, so no command is generated. Souvenir may ask for either displayed weapon.</SolverInstructions>
  </SolverLayout>;
}
