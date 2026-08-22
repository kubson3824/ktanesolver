package ktanesolver.module.modded.regular.orderedkeys;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record OrderedKeysOutput(int stage,List<Integer> ranks,List<Integer> pressOrder,String twitchCommand)implements ModuleOutput{}
