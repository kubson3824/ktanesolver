package ktanesolver.module.modded.regular.signals;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.Arrays;import java.util.List;import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;import ktanesolver.entity.ModuleEntity;import ktanesolver.entity.RoundEntity;import ktanesolver.logic.SolveFailure;import ktanesolver.logic.SolveSuccess;import ktanesolver.module.modded.regular.signals.SignalsInput.SwitchWiring;

class SignalsSolverTest {
	private final SignalsSolver solver=new SignalsSolver();
	private static final String[][] EXPECTED={
		{"-1,1,-1","-1,-1,-1","-1,-1,1","1,1,-1","1,1,1","1,-1,-1","-1,1,1","1,-1,1","0,1,1","-1,0,1","0,-1,-1","0,1,-1","1,0,-1","0,-1,1","-1,0,-1","1,0,1","1,1,0","-1,-1,0","1,-1,0","-1,1,0","0,0,-1","0,0,1","0,0,0","0,1,0","-1,0,0","1,0,0","0,-1,0"},
		{"1,1,-1","-1,1,-1","-1,1,1","1,1,1","-1,-1,-1","0,-1,-1","-1,-1,1","0,1,-1","1,0,1","1,-1,-1","0,-1,1","1,-1,1","0,1,1","1,-1,0","1,1,0","-1,0,1","1,0,-1","-1,0,-1","0,0,1","0,1,0","-1,-1,0","-1,0,0","0,-1,0","0,0,-1","0,0,0","-1,1,0","1,0,0"},
		{"-1,1,1","1,1,-1","0,1,-1","-1,-1,1","0,-1,-1","-1,-1,-1","1,1,1","1,-1,-1","-1,1,-1","1,0,1","1,0,-1","0,1,1","-1,0,1","1,-1,1","1,-1,0","1,1,0","-1,1,0","0,-1,1","-1,0,-1","0,0,1","-1,0,0","1,0,0","0,1,0","0,0,0","0,-1,0","0,0,-1","-1,-1,0"}
	};
	@Test void coversAllTwentySevenRowsAndStrikeBuckets(){for(int strikes=0;strikes<3;strikes++)for(int figure=1;figure<=27;figure++)assertThat(SignalsSolver.target(figure,strikes)).containsExactly(parse(EXPECTED[strikes][figure-1]));}
	@Test void translatesShuffledWiringAndFourStateClickCycle(){
		List<SwitchWiring> wiring=List.of(
			new SwitchWiring(2,0,-1,1,SignalsSwitchState.DOWN),
			new SwitchWiring(3,-1,1,0,SignalsSwitchState.CENTER_NEXT_DOWN),
			new SwitchWiring(1,1,0,-1,SignalsSwitchState.CENTER_NEXT_UP));
		var result=solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new SignalsInput(1,0,wiring));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		SignalsOutput output=((SolveSuccess<SignalsOutput>)result).output();
		assertThat(output.targetCoefficients()).containsExactly(-1,1,-1);
		assertThat(output.targetPositions()).containsExactly("DOWN","UP","DOWN");
		assertThat(output.clicks()).containsExactly("s2","s2","s2","s3","s3","s3");
	}
	@Test void validatesDecodedWiring(){List<SwitchWiring> invalid=List.of(new SwitchWiring(1,1,0,-1,SignalsSwitchState.DOWN),new SwitchWiring(1,1,0,-1,SignalsSwitchState.DOWN),new SwitchWiring(3,1,1,-1,SignalsSwitchState.DOWN));assertThat(solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new SignalsInput(1,0,invalid))).isInstanceOf(SolveFailure.class);}
	private static int[] parse(String value){return Arrays.stream(value.split(",")).mapToInt(Integer::parseInt).toArray();}
}
