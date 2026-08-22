package ktanesolver.module.modded.regular.vexillology;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record VexillologyInput(String flagType,List<String> flagpoleColors)implements ModuleInput{}
