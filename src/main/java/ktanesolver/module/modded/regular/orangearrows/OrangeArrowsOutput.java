package ktanesolver.module.modded.regular.orangearrows;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record OrangeArrowsOutput(int stage,List<String> pressSequence,String command)implements ModuleOutput{}
