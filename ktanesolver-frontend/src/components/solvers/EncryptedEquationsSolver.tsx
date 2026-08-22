import {useState} from "react";
import {
  CORNER_OPERATIONS, DIRECTIONS, ENCRYPTED_EQUATION_CHARACTERS, ENCRYPTED_EQUATION_SHAPES,
  MAIN_OPERATIONS, solveEncryptedEquations, SURROUND_SYMBOLS, type EncryptedEquationsInput,
  type EncryptedEquationsOutput, type EncryptedOperand,
} from "../../services/encryptedEquationsService";
import type {BombEntity} from "../../types";
import {ErrorAlert,SolverControls,SolverInstructions,SolverLayout,SolverSection,TwitchCommandDisplay,useSolver} from "../common";

const operand = (): EncryptedOperand => ({shape:"TRIANGLE",character:"A",surroundSymbol:"NONE",direction:"NORTH",cornerOperation:"NONE"});
const label = (value:string) => value.replaceAll("_", " ");

function OperandFields({name,value,onChange}:{name:string;value:EncryptedOperand;onChange:(value:EncryptedOperand)=>void}) {
  const set = (part:Partial<EncryptedOperand>) => onChange({...value,...part});
  return <fieldset className="rounded border p-2"><legend>{name} operand</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
    <label>Shape<select value={value.shape} onChange={e=>set({shape:e.target.value as EncryptedOperand["shape"]})} className="block h-10 w-full rounded border bg-background">{ENCRYPTED_EQUATION_SHAPES.map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label>
    <label>Inside<select value={value.character} onChange={e=>set({character:e.target.value as EncryptedOperand["character"]})} className="block h-10 w-full rounded border bg-background">{ENCRYPTED_EQUATION_CHARACTERS.map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label>
    <label>Surround<select value={value.surroundSymbol} onChange={e=>set({surroundSymbol:e.target.value as EncryptedOperand["surroundSymbol"]})} className="block h-10 w-full rounded border bg-background">{SURROUND_SYMBOLS.map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label>
    <label>Direction<select value={value.direction} disabled={value.surroundSymbol==="NONE"} onChange={e=>set({direction:e.target.value as EncryptedOperand["direction"]})} className="block h-10 w-full rounded border bg-background">{DIRECTIONS.map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Corner<select value={value.cornerOperation} onChange={e=>set({cornerOperation:e.target.value as EncryptedOperand["cornerOperation"]})} className="block h-10 w-full rounded border bg-background">{CORNER_OPERATIONS.map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label>
  </div></fieldset>;
}

export default function EncryptedEquationsSolver({bomb}:{bomb:BombEntity|null|undefined}) {
  const [input,setInput]=useState<EncryptedEquationsInput>({leftOperand:operand(),leftOperation:"ADD",middleOperand:operand(),rightOperation:"ADD",rightOperand:operand(),parentheses:"LEFT_PAIR"});
  const [result,setResult]=useState<EncryptedEquationsOutput|null>(null);
  const {isLoading,error,isSolved,setIsLoading,setError,setIsSolved,clearError,reset:resetSolver,currentModule,round,markModuleSolved}=useSolver();
  const solve=async()=>{if(!round?.id||!bomb?.id||!currentModule?.id)return setError("Missing required information");clearError();setIsLoading(true);try{const r=await solveEncryptedEquations(round.id,bomb.id,currentModule.id,input);setResult(r.output);setIsSolved(r.solved);if(r.solved)markModuleSolved(bomb.id,currentModule.id)}catch(e){setError(e instanceof Error?e.message:"Failed to solve Encrypted Equations")}finally{setIsLoading(false)}};
  const reset=()=>{setInput({leftOperand:operand(),leftOperation:"ADD",middleOperand:operand(),rightOperation:"ADD",rightOperand:operand(),parentheses:"LEFT_PAIR"});setResult(null);resetSolver()};
  return <SolverLayout><SolverSection title="Encrypted operands"><div className="space-y-2">
    <OperandFields name="Left" value={input.leftOperand} onChange={leftOperand=>setInput({...input,leftOperand})}/>
    <OperandFields name="Middle" value={input.middleOperand} onChange={middleOperand=>setInput({...input,middleOperand})}/>
    <OperandFields name="Right" value={input.rightOperand} onChange={rightOperand=>setInput({...input,rightOperand})}/>
  </div></SolverSection><SolverSection title="Equation structure"><div className="grid gap-2 sm:grid-cols-3">
    <label>Left operation<select value={input.leftOperation} onChange={e=>setInput({...input,leftOperation:e.target.value as EncryptedEquationsInput["leftOperation"]})} className="block h-10 w-full rounded border bg-background">{MAIN_OPERATIONS.map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Right operation<select value={input.rightOperation} onChange={e=>setInput({...input,rightOperation:e.target.value as EncryptedEquationsInput["rightOperation"]})} className="block h-10 w-full rounded border bg-background">{MAIN_OPERATIONS.map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Parentheses<select value={input.parentheses} onChange={e=>setInput({...input,parentheses:e.target.value as EncryptedEquationsInput["parentheses"]})} className="block h-10 w-full rounded border bg-background"><option value="LEFT_PAIR">First two operands</option><option value="RIGHT_PAIR">Last two operands</option></select></label>
  </div></SolverSection><SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/><ErrorAlert error={error}/>
  {result&&<SolverSection title="Submit"><p className="font-mono text-3xl">{result.answer}</p><p>Operand values: {result.operandValues.join(" · ")}</p></SolverSection>}{result&&<TwitchCommandDisplay command={result.twitchCommand}/>}<SolverInstructions>Use the manual to identify each shape and decode the two operation glyphs and the parentheses side. Select NONE when an operand has no surrounding or corner symbol.</SolverInstructions></SolverLayout>;
}
