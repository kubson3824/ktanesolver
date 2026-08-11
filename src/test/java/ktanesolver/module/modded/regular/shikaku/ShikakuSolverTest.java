package ktanesolver.module.modded.regular.shikaku;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.shikaku.ShikakuInput.Clue;

class ShikakuSolverTest {
	private final ShikakuSolver solver=new ShikakuSolver();
	@Test void selectsClosestOrAdjacentFurthestHintForEveryCompassNumber(){
		assertThat(ShikakuSolver.correctHint("G","V",1)).isEqualTo("G");
		assertThat(ShikakuSolver.correctHint("T","Y",2)).isEqualTo("T");
		assertThat(ShikakuSolver.correctHint("F","W",3)).isEqualTo("F");
		assertThat(ShikakuSolver.correctHint("G","W",1)).isEqualTo("G");
	}
	@Test void generatesEveryManualSymbolGeometry(){for(char c:"ABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray())assertThat(ShikakuSolver.symbolRegions(c)).as("symbol %s",c).isNotEmpty();}
	@Test void solvesACompleteNumericPartitionAndPaintsEveryCell(){
		List<Clue> clues=new ArrayList<>();for(int row=1;row<=6;row++)clues.add(new Clue("A"+row,"6",null));
		SolveSuccess<ShikakuOutput> result=(SolveSuccess<ShikakuOutput>)solver.solve(new RoundEntity(),new BombEntity(),module(),new ShikakuInput(clues));
		assertThat(result.output().regions()).hasSize(6);assertThat(result.output().regions()).allSatisfy(region->assertThat(region.cells()).hasSize(6));
		assertThat(result.output().regions().stream().flatMap(region->region.cells().stream())).hasSize(36).doesNotHaveDuplicates();
		assertThat(result.output().presses()).hasSize(36);assertThat(result.output().presses()).allMatch(cell->cell.matches("[A-F][1-6]"));
	}
	@Test void rejectsDuplicateCellsAndInvalidSymbolPairs(){
		assertThat(solver.solve(new RoundEntity(),new BombEntity(),module(),new ShikakuInput(List.of(new Clue("A1","2",null),new Clue("A1","3",null))))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(),new BombEntity(),module(),new ShikakuInput(List.of(new Clue("A1","G","G"))))).isInstanceOf(SolveFailure.class);
	}
	private static ModuleEntity module(){ModuleEntity m=new ModuleEntity();m.setType(ModuleType.SHIKAKU);m.setState(new HashMap<>());m.setSolution(new HashMap<>());return m;}
}
