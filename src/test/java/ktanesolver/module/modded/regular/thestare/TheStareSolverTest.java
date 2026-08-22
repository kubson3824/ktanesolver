package ktanesolver.module.modded.regular.thestare;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.thestare.TheStareInput.Eye;

class TheStareSolverTest{
 private final TheStareSolver solver=new TheStareSolver();
 @Test void computesDesiredStateAndTimerConditions(){BombEntity bomb=new BombEntity();bomb.setSerialNumber("AB2CD4");var out=solve(bomb,new TheStareInput(List.of(new Eye("Red","Small","Plain",false),new Eye("Green","Normal","Plain",true)),1,5,0,false));assertThat(out.desiredState()).isEqualTo("OPEN");assertThat(out.toggleNeeded()).isTrue();assertThat(out.activeTimerDigits()).contains(2,5,7);}
 @Test void unicornSerialClosesEveryEye(){BombEntity bomb=new BombEntity();bomb.setSerialNumber("DD1234");var out=solve(bomb,new TheStareInput(List.of(new Eye("Gold","Normal","Plain",true)),1,10,1,false));assertThat(out.desiredState()).isEqualTo("CLOSED");}
 @SuppressWarnings("unchecked")private TheStareOutput solve(BombEntity bomb,TheStareInput input){return ((SolveSuccess<TheStareOutput>)solver.solve(new RoundEntity(),bomb,new ModuleEntity(),input)).output();}
}
