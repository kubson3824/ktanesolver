package ktanesolver.module.modded.regular.mysticsquare;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MysticSquareOutput(int skullPosition, List<Integer> targetConstellation) implements ModuleOutput {
}
