package ktanesolver.module.modded.regular.doubleoh;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.doubleoh.DoubleOhInput.Button;

public record DoubleOhOutput(List<Button> presses) implements ModuleOutput {}
