package ktanesolver.module.modded.regular.lionsshare;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record LionsShareInput(int year,List<String>lions,String leadHuntress)implements ModuleInput{}
