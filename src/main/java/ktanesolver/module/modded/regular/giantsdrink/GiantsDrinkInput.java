package ktanesolver.module.modded.regular.giantsdrink;
import ktanesolver.logic.ModuleInput;
public record GiantsDrinkInput(Goblet left,Goblet right)implements ModuleInput{public record Goblet(String material,String gem,String liquid,int heightRank,int gemCount,String gemPlacement){}}
