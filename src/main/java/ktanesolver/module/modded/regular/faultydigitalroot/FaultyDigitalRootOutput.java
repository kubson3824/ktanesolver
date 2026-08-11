package ktanesolver.module.modded.regular.faultydigitalroot;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record FaultyDigitalRootOutput(int root, String binary, List<String> presses) implements ModuleOutput {}
