package ktanesolver.module.modded.regular.boggle;
import java.util.List;import ktanesolver.logic.ModuleInput;
public record BoggleInput(List<VisibleCell> visible) implements ModuleInput {public record VisibleCell(String cell,String letter){}}
