package ktanesolver.module.modded.regular.mafia;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.mafia.MafiaInput.Suspect;

public record MafiaOutput(Suspect godfather, Suspect lastRemaining, List<Suspect> eliminationOrder) implements ModuleOutput {
}
