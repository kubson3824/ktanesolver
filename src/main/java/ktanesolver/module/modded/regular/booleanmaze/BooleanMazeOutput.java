package ktanesolver.module.modded.regular.booleanmaze;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record BooleanMazeOutput(String action,List<Integer> from,List<Integer> to,List<Integer> goal) implements ModuleOutput {}
