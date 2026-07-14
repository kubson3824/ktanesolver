package ktanesolver.module.modded.regular.battleship;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BattleshipOutput(List<String> safeLocations, List<String> shipLocations) implements ModuleOutput {}
