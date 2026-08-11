package ktanesolver.module.modded.regular.tennis;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashMap;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TennisSolverTest{
	private final TennisSolver solver=new TennisSolver();
	@Test void convertsSerialAndAdvancesThirtyReceiverPoints(){TennisOutput out=solve(bomb("000000"),new TennisInput("US_OPEN",false,List.of(new TennisInput.SetScore(0,0)),"NORMAL",0,0));assertThat(out.binary()).isEqualTo("000000000000000000000000000000");assertThat(out.winner()).isNull();assertThat(out.sets()).containsExactly(new TennisInput.SetScore(3,4));assertThat(out.mode()).isEqualTo("NORMAL");assertThat(out.player1Score()).isEqualTo(30);assertThat(out.player2Score()).isZero();assertThat(out.actions()).startsWith("LR");}
	@Test void stopsAsSoonAsTheMatchIsWon(){TennisOutput out=solve(bomb("000000"),new TennisInput("US_OPEN",false,List.of(new TennisInput.SetScore(6,0),new TennisInput.SetScore(5,0)),"NORMAL",40,0));assertThat(out.winner()).isEqualTo(1);assertThat(out.actions()).containsExactly("P1");}
	@Test void usesTheManualFiveBitCharacterValues(){TennisOutput out=solve(bomb("A0Z900"),new TennisInput("FRENCH_OPEN",true,List.of(new TennisInput.SetScore(0,0)),"DEUCE",0,0));assertThat(out.binary()).isEqualTo("001100000011111010010000000000");}
	@Test void validatesDisplayedState(){assertThat(solver.solve(null,bomb("ABC123"),module(),new TennisInput("WIMBLEDON",false,List.of(),"NORMAL",0,0))).isInstanceOf(SolveFailure.class);assertThat(solver.solve(null,bomb("ABC123"),module(),new TennisInput("WIMBLEDON",false,List.of(new TennisInput.SetScore(0,0)),"NORMAL",10,0))).isInstanceOf(SolveFailure.class);}
	private TennisOutput solve(BombEntity b,TennisInput input){return((SolveSuccess<TennisOutput>)solver.solve(null,b,module(),input)).output();}private static BombEntity bomb(String serial){BombEntity b=new BombEntity();b.setSerialNumber(serial);return b;}private static ModuleEntity module(){ModuleEntity m=new ModuleEntity();m.setType(ModuleType.TENNIS);m.setState(new HashMap<>());m.setSolution(new HashMap<>());return m;}
}
