package ktanesolver.module.modded.regular.orderedkeys;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record OrderedKeysInput(int stage,List<Key> keys) implements ModuleInput{public record Key(Color keyColor,Color labelColor,int label){}public enum Color{RED,GREEN,BLUE,CYAN,MAGENTA,YELLOW}}
