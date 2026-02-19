
package ktanesolver.module.modded.regular.safetysafe;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

/**
 * Number of turns (0-11) from the loud-click starting position for each of the 6 dials.
 * Order: Top Left, Top Middle, Top Right, Bottom Left, Bottom Middle, Bottom Right.
 */
public record SafetySafeOutput(List<Integer> dialTurns) implements ModuleOutput {
}
