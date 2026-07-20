import { useCallback, useMemo, useState } from "react";
import {
  solveMonsplodeTradingCards, type MonsplodeTradingCard, type MonsplodeTradingCardsOutput,
} from "../../services/monsplodeTradingCardsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const MONSPLODES = [
  "Aluga", "Asteran", "Bob", "Buhar", "Caadarim", "Clondar", "Cutie Pie", "Docsplode",
  "Flaurim", "Gloorim", "Lanaluff", "Lugirit", "Magmy", "Melbor", "Mountoise", "Myrchat",
  "Nibs", "Percy", "Pouse", "Ukkens", "Vellarim", "Violan", "Zapra", "Zenlad",
  "Aluga, The Fighter", "Bob, The Ancestor", "Buhar, The Protector", "Melbor, The Web Bug",
];
const RARITIES = [
  ["COMMON", "Common ●"], ["UNCOMMON", "Uncommon ♦"], ["RARE", "Rare ★"], ["ULTRA_RARE", "Ultra Rare ☆"],
] as const;
const defaultCard = (name = "Aluga"): MonsplodeTradingCard => ({ name, rarity: "COMMON", printVersion: "A1", foil: false, bentCorners: 0 });

function CardEditor({ label, card, disabled, onChange }: {
  label: string; card: MonsplodeTradingCard; disabled: boolean; onChange: (card: MonsplodeTradingCard) => void;
}) {
  const update = <K extends keyof MonsplodeTradingCard>(key: K, value: MonsplodeTradingCard[K]) => onChange({ ...card, [key]: value });
  return <fieldset className="space-y-3 rounded-lg border bg-card p-4">
    <legend className="px-1 font-semibold">{label}</legend>
    <label className="block space-y-1 text-sm font-medium">Monsplode
      <select aria-label={`${label} Monsplode`} value={card.name} disabled={disabled} onChange={(event) => update("name", event.target.value)} className="block h-10 w-full rounded-md border border-input bg-background px-3">
        {MONSPLODES.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
    <label className="block space-y-1 text-sm font-medium">Rarity
      <select aria-label={`${label} rarity`} value={card.rarity} disabled={disabled} onChange={(event) => update("rarity", event.target.value as MonsplodeTradingCard["rarity"])} className="block h-10 w-full rounded-md border border-input bg-background px-3">
        {RARITIES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
    <div className="grid grid-cols-2 gap-2">
      <label className="block space-y-1 text-sm font-medium">Print letter
        <select aria-label={`${label} print letter`} value={card.printVersion[0] ?? "A"} disabled={disabled} onChange={(event) => update("printVersion", event.target.value + card.printVersion.slice(1))} className="block h-10 w-full rounded-md border border-input bg-background px-3">
          {"ABCDEFGHI".split("").map((letter) => <option key={letter}>{letter}</option>)}
        </select>
      </label>
      <label className="block space-y-1 text-sm font-medium">Print number
        <input aria-label={`${label} print number`} type="number" min={1} max={9} value={card.printVersion.slice(1)} disabled={disabled} onChange={(event) => update("printVersion", (card.printVersion[0] ?? "A") + event.target.value)} className="block h-10 w-full rounded-md border border-input bg-background px-3" />
      </label>
    </div>
    <label className="block space-y-1 text-sm font-medium">Bent corners
      <input aria-label={`${label} bent corners`} type="number" min={0} max={4} value={card.bentCorners} disabled={disabled} onChange={(event) => update("bentCorners", Number(event.target.value))} className="block h-10 w-full rounded-md border border-input bg-background px-3" />
    </label>
    <label className="flex items-center gap-2 text-sm font-medium">
      <input aria-label={`${label} foil`} type="checkbox" checked={card.foil} disabled={disabled} onChange={(event) => update("foil", event.target.checked)} /> Foil card
    </label>
  </fieldset>;
}

export default function MonsplodeTradingCardsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [hand, setHand] = useState<MonsplodeTradingCard[]>([defaultCard("Aluga"), defaultCard("Bob"), defaultCard("Buhar")]);
  const [offer, setOffer] = useState(defaultCard("Asteran"));
  const [selectedCard, setSelectedCard] = useState(1);
  const [result, setResult] = useState<MonsplodeTradingCardsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ hand, offer, selectedCard, result, twitchCommand }), [hand, offer, selectedCard, result, twitchCommand]);

  useSolverModulePersistence<typeof state, MonsplodeTradingCardsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.hand?.length === 3) setHand(saved.hand);
      if (saved.offer) setOffer(saved.offer);
      if (saved.selectedCard) setSelectedCard(saved.selectedCard);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MonsplodeTradingCardsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MONSPLODE_TRADING_CARDS, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule, setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveMonsplodeTradingCards(round.id, bomb.id, currentModule.id, { hand, offer, selectedCard });
      const output = response.output;
      const command = generateTwitchCommand({ moduleType: ModuleType.MONSPLODE_TRADING_CARDS, result: output });
      const nextHand = output.tradeCard == null ? hand : hand.map((card, index) => index === output.tradeCard! - 1 ? offer : card);
      const nextSelected = output.tradeCard ?? selectedCard;
      setResult(output); setTwitchCommand(command); setHand(nextHand); setSelectedCard(nextSelected); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { hand: nextHand, offer, selectedCard: nextSelected, result: output, twitchCommand: command }, output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Monsplode Trading Cards");
    } finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, hand, offer, selectedCard, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setHand([defaultCard("Aluga"), defaultCard("Bob"), defaultCard("Buhar")]); setOffer(defaultCard("Asteran"));
    setSelectedCard(1); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);
  const disabled = isLoading || isSolved;
  const updateHand = (index: number, card: MonsplodeTradingCard) => setHand((cards) => cards.map((current, i) => i === index ? card : current));

  return <SolverLayout>
    <SolverSection title="Trade progress" description={isSolved ? "All 3 offers complete." : `Enter the cards for offer ${Math.min((result?.stage ?? 0) + 1, 3)}.`}>
      <StageIndicator total={3} current={isSolved ? 4 : (result?.stage ?? 0) + 1} completedThrough={result?.stage ?? 0} />
    </SolverSection>
    {!isSolved && <>
      <SolverSection title="Cards in hand" description="Enter all visible card details. Card 1 is the leftmost selection.">
        <div className="grid gap-4 lg:grid-cols-3">{hand.map((card, index) => <CardEditor key={index} label={`Hand card ${index + 1}`} card={card} disabled={disabled} onChange={(value) => updateHand(index, value)} />)}</div>
      </SolverSection>
      <SolverSection title="Offered card"><CardEditor label="Offer" card={offer} disabled={disabled} onChange={setOffer} /></SolverSection>
      <SolverSection title="Current selection" description="Needed to produce safe Twitch navigation commands.">
        <label className="block max-w-xs space-y-1 text-sm font-medium">Displayed hand card
          <select value={selectedCard} onChange={(event) => setSelectedCard(Number(event.target.value))} disabled={disabled} className="block h-10 w-full rounded-md border border-input bg-background px-3">
            {[1, 2, 3].map((card) => <option key={card} value={card}>Card {card}</option>)}
          </select>
        </label>
      </SolverSection>
    </>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={`Solve offer ${Math.min((result?.stage ?? 0) + 1, 3)}`} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Offer ${result.stage}: ${result.action === "KEEP" ? "Keep your cards" : `Trade card ${result.tradeCard}`}`} className="border-emerald-500/40">
      <div className="grid gap-2 text-center sm:grid-cols-4">
        {result.handValues.map((value, index) => <div key={index} className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Hand {index + 1}</div><div className="text-xl font-bold">{value}</div></div>)}
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3"><div className="text-xs text-muted-foreground">Offer</div><div className="text-xl font-bold">{result.offerValue}</div></div>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>If every hand card is worth more than the offer, press Keep. Otherwise select any least-valued hand card and press Trade.</SolverInstructions>
  </SolverLayout>;
}
