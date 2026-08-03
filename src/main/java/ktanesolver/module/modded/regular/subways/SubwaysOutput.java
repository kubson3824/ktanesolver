package ktanesolver.module.modded.regular.subways;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SubwaysOutput(int route, String time, List<String> stops) implements ModuleOutput {
}
