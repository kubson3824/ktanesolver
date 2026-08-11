package ktanesolver.module.modded.regular.signals;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record SignalsInput(int inputFigure, int strikes, List<SwitchWiring> switches) implements ModuleInput {
	public record SwitchWiring(int coefficient, int upValue, int centerValue, int downValue, SignalsSwitchState currentState) {}
}
