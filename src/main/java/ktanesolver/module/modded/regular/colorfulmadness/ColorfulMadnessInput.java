package ktanesolver.module.modded.regular.colorfulmadness;import java.util.List;import ktanesolver.logic.ModuleInput;
public record ColorfulMadnessInput(List<Button>topButtons)implements ModuleInput{public record Button(boolean redYellow,Pattern pattern,int counterpart){}public enum Pattern{OTHER,CHECKERBOARD_4,SQUARE_ON_SQUARE}}
