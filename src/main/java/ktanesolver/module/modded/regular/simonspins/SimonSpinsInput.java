package ktanesolver.module.modded.regular.simonspins;
import java.util.List;import java.util.Map;import ktanesolver.logic.ModuleInput;
public record SimonSpinsInput(Integer stage,Map<String,List<String>> properties,Boolean confirmSolved)implements ModuleInput{}
