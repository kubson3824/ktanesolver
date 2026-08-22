package ktanesolver.module.modded.regular.tashasqueals;

import java.util.List;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.tashasqueals.TashaSquealsInput.Color;

public record TashaSquealsOutput(List<Color> pressColors, List<List<Color>> stageSequences) implements ModuleOutput {}
