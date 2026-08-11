package ktanesolver.module.modded.regular.accumulation;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.accumulation.AccumulationInput.Color;
import ktanesolver.module.modded.regular.accumulation.AccumulationInput.StageObservation;

class AccumulationSolverTest {
	private final AccumulationSolver solver=new AccumulationSolver();
	@Test void calculatesAllFiveStagesAndStoresFinalSouvenirColors(){
		BombEntity bomb=new BombEntity();bomb.setAaBatteryCount(2);bomb.setDBatteryCount(1);bomb.setIndicators(Map.of("BOB",true));bomb.replacePortPlates(List.of(Set.of(PortType.DVI),Set.of()));
		List<Color> redDigits=new ArrayList<>(Collections.nCopies(10,Color.RED));
		List<StageObservation> stages=List.of(stage(Color.ORANGE,redDigits),stage(Color.GREEN,redDigits),stage(Color.YELLOW,redDigits),stage(Color.BROWN,redDigits),stage(Color.LIME,redDigits));
		ModuleEntity module=new ModuleEntity();
		var output=((SolveSuccess<AccumulationOutput>)solver.solve(new RoundEntity(),bomb,module,new AccumulationInput(Color.BLUE,stages))).output();
		assertThat(output.answers()).containsExactly(17,59,123,266,447);assertThat(output.actions()).containsExactly("submit 447");
		assertThat(module.getState()).containsEntry("accumulationBorderColor","Blue").containsEntry("accumulationBackgroundColors",List.of("Orange","Green","Yellow","Brown","Lime"));
	}
	@Test void appliesModuloAndOverwritesAttemptFacts(){
		BombEntity bomb=new BombEntity();bomb.setAaBatteryCount(980);ModuleEntity module=new ModuleEntity();List<Color> colors=new ArrayList<>(Collections.nCopies(10,Color.BLUE));
		var output=((SolveSuccess<AccumulationOutput>)solver.solve(new RoundEntity(),bomb,module,new AccumulationInput(Color.BROWN,List.of(stage(Color.LIME,colors))))).output();
		assertThat(output.currentAnswer()).isEqualTo(29);assertThat(module.getState()).containsEntry("accumulationBackgroundColors",List.of("Lime"));
	}
	@Test void validatesStageHistory(){assertThat(solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new AccumulationInput(Color.BLUE,List.of(new StageObservation(Color.RED,List.of()))))).isInstanceOf(SolveFailure.class);}
	private static StageObservation stage(Color background,List<Color> digits){return new StageObservation(background,digits);}
}
