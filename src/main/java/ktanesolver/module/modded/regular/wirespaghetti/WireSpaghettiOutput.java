package ktanesolver.module.modded.regular.wirespaghetti;
import java.util.List;
import ktanesolver.logic.ModuleOutput;
public record WireSpaghettiOutput(List<String> colors, List<String> aliases) implements ModuleOutput {}
