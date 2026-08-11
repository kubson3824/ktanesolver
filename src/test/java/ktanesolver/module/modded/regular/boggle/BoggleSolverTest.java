package ktanesolver.module.modded.regular.boggle;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashMap;import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;import ktanesolver.entity.ModuleEntity;import ktanesolver.enums.ModuleType;import ktanesolver.logic.SolveFailure;import ktanesolver.logic.SolveSuccess;
class BoggleSolverTest{
	private final BoggleSolver solver=new BoggleSolver();
	@Test void identifiesBoardFromFourVisibleCellsAndStoresSouvenirLetters(){ModuleEntity m=module();BoggleOutput out=success(m,List.of(new BoggleInput.VisibleCell("A1","I"),new BoggleInput.VisibleCell("D1","N"),new BoggleInput.VisibleCell("A4","C"),new BoggleInput.VisibleCell("D4","R")));assertThat(out.board()).containsExactly("ISHN","PWTE","OOQE","CAHR");assertThat(out.plays()).extracting(BoggleOutput.Play::word).containsExactly("hoopster");assertThat(out.score()).isEqualTo(11);assertThat(m.getState().get("visibleLetters")).isEqualTo(List.of("I","N","C","R"));}
	@Test void everyCuratedDefaultBoardPlanIsAdjacentNonRepeatingAndWorthFive(){for(int v=0;v<7;v++)for(int h=0;h<7;h++){BoggleOutput out=BoggleSolver.plan(v,h);assertThat(out.score()).isGreaterThanOrEqualTo(5);for(BoggleOutput.Play play:out.plays()){assertThat(play.cells()).doesNotHaveDuplicates();for(int i=1;i<play.cells().size();i++){String a=play.cells().get(i-1),b=play.cells().get(i);assertThat(Math.max(Math.abs(a.charAt(0)-b.charAt(0)),Math.abs(a.charAt(1)-b.charAt(1)))).isEqualTo(1);}}}}
	@Test void qTileConsumesTheImplicitU(){BoggleOutput out=BoggleSolver.plan(0,1);assertThat(out.plays().get(0).word()).isEqualTo("requote");assertThat(out.plays().get(0).cells()).hasSize(6);}
	@Test void rejectsAmbiguousOrInvalidObservations(){assertThat(solver.solve(null,new BombEntity(),module(),new BoggleInput(List.of(new BoggleInput.VisibleCell("A1","I"))))).isInstanceOf(SolveFailure.class);assertThat(solver.solve(null,new BombEntity(),module(),new BoggleInput(List.of(new BoggleInput.VisibleCell("A1","X"),new BoggleInput.VisibleCell("B1","X"),new BoggleInput.VisibleCell("C1","X"),new BoggleInput.VisibleCell("D1","X"))))).isInstanceOf(SolveFailure.class);}
	private BoggleOutput success(ModuleEntity m,List<BoggleInput.VisibleCell>v){return((SolveSuccess<BoggleOutput>)solver.solve(null,new BombEntity(),m,new BoggleInput(v))).output();}private static ModuleEntity module(){ModuleEntity m=new ModuleEntity();m.setType(ModuleType.BOGGLE);m.setState(new HashMap<>());m.setSolution(new HashMap<>());return m;}
}
