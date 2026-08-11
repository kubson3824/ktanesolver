package ktanesolver.module.modded.regular.dividedsquares;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record DividedSquaresInput(List<List<Color>> grid,Color examinedColor)implements ModuleInput{public enum Color{RED,YELLOW,GREEN,BLUE,BLACK,WHITE}}
