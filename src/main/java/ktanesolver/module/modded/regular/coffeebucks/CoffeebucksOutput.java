package ktanesolver.module.modded.regular.coffeebucks;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record CoffeebucksOutput(String customerName,List<String> drinks,String selectedDrink,String quirkCommand,int projectedTipTotalCents)implements ModuleOutput{}
