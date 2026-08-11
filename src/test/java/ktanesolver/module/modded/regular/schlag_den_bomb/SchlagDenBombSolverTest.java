package ktanesolver.module.modded.regular.schlag_den_bomb;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.*;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.*;import ktanesolver.logic.*;

class SchlagDenBombSolverTest{private final SchlagDenBombSolver solver=new SchlagDenBombSolver();
	@Test void assignsAllCategoriesAndFindsAValidOddballSubset(){SchlagDenBombOutput out=solve(bomb("ABC123"),new ModuleEntity(),new SchlagDenBombInput("Gale",47,73));assertThat(out.gameTypes()).containsExactly("O","P","O","P","M","O","O","M","O","Q","Q","O","M","P","Q");assertThat(out.contestantGames()).containsExactly(1,3,6,10,13,14);assertThat(out.bombGames()).containsExactly(2,4,5,7,8,9,11,12,15);assertThat(out.unplayedGames()).isEmpty();}
	@Test void stopsAfterEitherSidePassesSixtyAndMarksTheExactTailUnplayed(){SchlagDenBombOutput out=solve(bomb("ABC123"),new ModuleEntity(),new SchlagDenBombInput("Gale",10,68));assertThat(out.contestantGames()).containsExactly(10);assertThat(out.unplayedGames()).containsExactly(13,14,15);assertThat(out.bombGames()).containsExactly(1,2,3,4,5,6,7,8,9,11,12);}
	@Test void recordsAllThreeSouvenirFactsAndRejectsImpossibleScores(){ModuleEntity module=new ModuleEntity();SchlagDenBombOutput out=solve(bomb("ABC123"),module,new SchlagDenBombInput("gale",10,68));assertThat(out.contestantName()).isEqualTo("Gale");assertThat(module.getState()).containsEntry("schlagContestantName","Gale").containsEntry("schlagContestantScore",10).containsEntry("schlagBombScore",68);assertThat(solver.solve(new RoundEntity(),bomb("ABC123"),new ModuleEntity(),new SchlagDenBombInput("Gale",60,60))).isInstanceOf(SolveFailure.class);}
	@SuppressWarnings("unchecked")private SchlagDenBombOutput solve(BombEntity bomb,ModuleEntity module,SchlagDenBombInput input){return((SolveSuccess<SchlagDenBombOutput>)solver.solve(new RoundEntity(),bomb,module,input)).output();}private static BombEntity bomb(String serial){BombEntity bomb=new BombEntity();bomb.setSerialNumber(serial);return bomb;}}
