package ktanesolver.module.modded.regular.simonspins;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record SimonSpinsOutput(int stage,List<String>presses,List<String>remembered,List<String>requiredPropertiesForNextStage,boolean confirmedSolved)implements ModuleOutput{}
