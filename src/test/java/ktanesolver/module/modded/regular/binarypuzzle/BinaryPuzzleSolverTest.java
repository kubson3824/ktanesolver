package ktanesolver.module.modded.regular.binarypuzzle;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;import org.junit.jupiter.api.Test;import ktanesolver.entity.*;import ktanesolver.logic.SolveSuccess;
class BinaryPuzzleSolverTest{@Test void solvesAnEmptyTakuzuGrid(){var r=new BinaryPuzzleSolver().solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new BinaryPuzzleInput(List.of("??????","??????","??????","??????","??????","??????")));var o=((SolveSuccess<BinaryPuzzleOutput>)r).output();assertThat(o.solution()).hasSize(36);assertThat(o.rows()).hasSize(6).doesNotHaveDuplicates();}}
