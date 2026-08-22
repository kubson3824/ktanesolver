package ktanesolver.module.modded.regular.mazematics;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record MazematicsOutput(String restrictedValues,List<String> moves,List<Integer> runningValues,String twitchCommand) implements ModuleOutput {}
