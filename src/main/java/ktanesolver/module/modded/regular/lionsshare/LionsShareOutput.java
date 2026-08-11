package ktanesolver.module.modded.regular.lionsshare;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record LionsShareOutput(List<Portion>portions,int totalEntitlement)implements ModuleOutput{public record Portion(String lion,int percentage,int entitlement){}}
