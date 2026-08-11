package ktanesolver.module.modded.regular.partytime;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.partytime.PartyTimeInput.SpaceType;

class PartyTimeSolverTest {
	private final PartyTimeSolver solver=new PartyTimeSolver();
	@Test void classifiesAdjacencyAcrossTheSerpentineBoard() {
		List<SpaceType> board=board();
		board.set(1,SpaceType.WATER);board.set(8,SpaceType.D_BATTERY);
		board.set(6,SpaceType.FIRE);board.set(13,SpaceType.WATER);
		board.set(12,SpaceType.FIRE);board.set(17,SpaceType.FIRE);
		PartyTimeOutput output=solve(board);
		assertThat(output.dieSpaces()).containsExactly(1,17);
		assertThat(output.pressSpaces()).containsExactly(6,12,13);
		assertThat(output.actions()).containsExactly("die 1 17","space 6 12 13","roll start");
	}
	@Test void appliesBothFourSpaceOverrides() {
		List<SpaceType> fireHeavy=board();for(int i=1;i<=4;i++)fireHeavy.set(i,SpaceType.FIRE);fireHeavy.set(10,SpaceType.WATER);fireHeavy.set(12,SpaceType.WATER);
		assertThat(solve(fireHeavy).dieSpaces()).contains(10,12);
		List<SpaceType> waterHeavy=board();for(int i=1;i<=4;i++)waterHeavy.set(i,SpaceType.WATER);waterHeavy.set(10,SpaceType.FIRE);waterHeavy.set(12,SpaceType.FIRE);
		assertThat(solve(waterHeavy).pressSpaces()).contains(10,12);
	}
	@Test void validatesBoardShapeAndFixedEndpoints() {
		assertThat(solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new PartyTimeInput(List.of()))).isInstanceOf(SolveFailure.class);
		List<SpaceType> invalid=board();invalid.set(0,SpaceType.NORMAL);
		assertThat(solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new PartyTimeInput(invalid))).isInstanceOf(SolveFailure.class);
	}
	@SuppressWarnings("unchecked")private PartyTimeOutput solve(List<SpaceType> board){return((SolveSuccess<PartyTimeOutput>)solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new PartyTimeInput(board))).output();}
	private static List<SpaceType> board(){List<SpaceType> spaces=new ArrayList<>(java.util.Collections.nCopies(20,SpaceType.NORMAL));spaces.set(0,SpaceType.START);spaces.set(19,SpaceType.GOAL);return spaces;}
}
