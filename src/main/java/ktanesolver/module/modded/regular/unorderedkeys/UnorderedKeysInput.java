package ktanesolver.module.modded.regular.unorderedkeys;import java.util.List;import ktanesolver.logic.ModuleInput;
public record UnorderedKeysInput(int resetCount,List<Key>keys)implements ModuleInput{public record Key(boolean active,Color keyColor,Color labelColor,Integer label){}public enum Color{RED,GREEN,BLUE,CYAN,MAGENTA,YELLOW}}
