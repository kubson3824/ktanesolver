package ktanesolver.module.modded.regular.boggle;
import java.util.List;import ktanesolver.logic.ModuleOutput;
public record BoggleOutput(List<String> board,List<Play> plays,int score) implements ModuleOutput {public record Play(String word,List<String> cells,int score){}}
