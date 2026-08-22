package ktanesolver.module.modded.regular.mazematics;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record MazematicsInput(List<Integer> shapeValues,String startCoordinate,int initialValue,int goalValue) implements ModuleInput {}
