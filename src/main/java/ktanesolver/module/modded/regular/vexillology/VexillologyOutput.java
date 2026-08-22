package ktanesolver.module.modded.regular.vexillology;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record VexillologyOutput(List<String> flagColors,String country,String submitDigit,List<String> commands)implements ModuleOutput{}
