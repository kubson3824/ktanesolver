package ktanesolver.module.modded.regular.quizbuzz;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.quizbuzz.QuizBuzzOutput.StageType;

class QuizBuzzSolverTest {
    private final QuizBuzzSolver solver=new QuizBuzzSolver();
    @Test void producesFizzBuzzAndDoesNotReusePositions(){ModuleEntity module=new ModuleEntity();QuizBuzzOutput first=solve(module,new QuizBuzzInput(15,"Bases","Bases",true));assertThat(first.stageType()).isEqualTo(StageType.FIZZ_BUZZ);assertThat(first.answer()).isEqualTo("22");QuizBuzzOutput second=solve(module,new QuizBuzzInput(18,"Bases","Bases",false));assertThat(second.answer()).isEqualTo("3");assertThat(second.fizzPosition()).isEqualTo(2);assertThat(module.getState().get("quizBuzzStartingNumber")).isEqualTo(15);}
    @Test void solvesAfterTenAcceptedStages(){ModuleEntity module=new ModuleEntity();QuizBuzzOutput out=null;for(int stage=16;stage<26;stage++)out=solve(module,new QuizBuzzInput(stage,"Bases","Bases",stage==16));assertThat(out.completedStages()).isEqualTo(10);}
    @SuppressWarnings("unchecked") private QuizBuzzOutput solve(ModuleEntity module,QuizBuzzInput input){return ((SolveSuccess<QuizBuzzOutput>)solver.solve(new RoundEntity(),new BombEntity(),module,input)).output();}
}
