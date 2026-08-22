package ktanesolver.module.modded.regular.giantsdrink;
import java.util.List;import ktanesolver.logic.ModuleOutput;public record GiantsDrinkOutput(String safeGoblet,String poisonedGoblet,List<Integer>path,String command)implements ModuleOutput{}
