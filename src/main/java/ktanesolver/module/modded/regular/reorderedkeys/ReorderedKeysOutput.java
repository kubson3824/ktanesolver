package ktanesolver.module.modded.regular.reorderedkeys;import java.util.List;import ktanesolver.logic.ModuleOutput;
public record ReorderedKeysOutput(int stage,List<Integer> values,int pivot,List<String> swaps,List<Integer> target,String twitchCommand)implements ModuleOutput{}
