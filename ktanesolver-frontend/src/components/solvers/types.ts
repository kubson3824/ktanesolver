import type { BombEntity } from "../../types";

/**
 * Standard props interface shared by all solver components.
 */
export interface SolverProps {
  bomb: BombEntity | null | undefined;
}
