import { ModuleType } from "../../types";
import type { SolverProps } from "./types";
import { solveThirdBase } from "../../services/thirdBaseService";
import {
  SixButtonWordSolver,
  type SixButtonWordSolverConfig,
} from "./WhosOnFirstSolver";

const LABELS = [
  "NHXS", "IH6X", "XI8Z", "I8O9", "XOHZ", "H68S", "8OXN",
  "Z8IX", "SXHN", "6NZH", "H6SI", "6O8I", "NXO8", "66I8",
  "S89H", "SNZX", "9NZS", "8I99", "ZHOX", "SI9X", "SZN6",
  "ZSN8", "HZN9", "X9HI", "IS9H", "XZNS", "X6IS", "8NSZ",
] as const;

const CONFIG: SixButtonWordSolverConfig = {
  moduleType: ModuleType.THIRD_BASE,
  name: "Third Base",
  solve: solveThirdBase,
  displayDescription: "Enter the four-character label shown on the display.",
  instructions: "Enter the display and all six button labels. Press the revealed button, then repeat for three stages.",
  displaySuggestions: LABELS,
  buttonOptions: LABELS,
};

export default function ThirdBaseSolver({ bomb }: SolverProps) {
  return <SixButtonWordSolver bomb={bomb} config={CONFIG} />;
}
