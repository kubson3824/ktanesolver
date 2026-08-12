package ktanesolver.module.modded.regular.discoloredsquares;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record DiscoloredSquaresOutput(int stage, String activeColor, String instruction, List<String> presses, List<String> remembered) implements ModuleOutput {}
