package ktanesolver.module.modded.regular.signals;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record SignalsOutput(List<Integer> targetCoefficients, List<String> targetPositions, List<String> clicks) implements ModuleOutput {}
