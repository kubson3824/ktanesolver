package ktanesolver.module.modded.regular.arithmelogic;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashMap;import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.*;import ktanesolver.logic.*;import ktanesolver.module.modded.regular.arithmelogic.ArithmelogicInput.Operator;
class ArithmelogicSolverTest{
 @Test void selectsTheGreatestValueWithEachRequiredTruth(){BombEntity b=new BombEntity();b.setSerialNumber("ABC123");b.setIndicators(new HashMap<>());ModuleEntity m=new ModuleEntity();var i=new ArithmelogicInput(21,21,21,1,Operator.AND,Operator.AND,true,List.of(10,11,12,13),List.of(14,15,16,17),List.of(18,19,20,21));var o=(SolveSuccess<ArithmelogicOutput>)new ArithmelogicSolver().solve(new RoundEntity(),b,m,i);assertThat(o.output().selectedValues()).containsExactly(13,17,21);assertThat(o.output().adjustedValues()).containsExactly(28,32,36);assertThat(o.output().twitchCommand()).isEqualTo("submit 13 17 21");assertThat(m.getState().get("arithmelogicSubmitSymbol")).isEqualTo(1);}
 @Test void implementsAllLogicalPredicates(){assertThat(ArithmelogicSolver.predicate(4).test(97)).isTrue();assertThat(ArithmelogicSolver.predicate(18).test(49)).isTrue();assertThat(ArithmelogicSolver.predicate(22).test(18)).isTrue();}
}
