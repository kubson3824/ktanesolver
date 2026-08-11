package ktanesolver.module.modded.regular.coffeebucks;
import ktanesolver.logic.ModuleInput;
public record CoffeebucksInput(String customerName,NameColor nameColor,Sugar sugar,TimeOfDay timeOfDay,Stress stress,Size size,int tipTotalCents,int currentTipCents)implements ModuleInput{
 public enum NameColor{WHITE,RED,GREEN,BLUE,PINK}
 public enum Sugar{DIABETIC_IN_WAITING,JUST_A_BIT,SUGAR_IS_MURDER,LOADS}
 public enum TimeOfDay{MORNING,AFTERNOON,EVENING,LUNCHTIME}
 public enum Stress{CALM,AGITATED,STRESSED,MURDEROUS}
 public enum Size{VENTI,SHORT,TALL,GRANDE}
}
