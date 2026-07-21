package ktanesolver.module.modded.regular.mortalkombat;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MortalKombatOutput(List<Move> attacks, Move fatality) implements ModuleOutput {
	public record Move(String name, String controls) {
	}
}
