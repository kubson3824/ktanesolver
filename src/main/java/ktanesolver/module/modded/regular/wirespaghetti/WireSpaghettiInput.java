package ktanesolver.module.modded.regular.wirespaghetti;
import java.util.List;
import ktanesolver.logic.ModuleInput;
public record WireSpaghettiInput(List<String> wires) implements ModuleInput {}
