package ktanesolver.module.modded.regular.unorderedkeys;import java.util.List;import ktanesolver.logic.ModuleOutput;
public record UnorderedKeysOutput(int targetValue,List<Integer>decodedValues,List<Integer>validPositions,Action action,String twitchCommand)implements ModuleOutput{public enum Action{PRESS,RESET}}
