package ktanesolver.module.modded.regular.modulehomework;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ModuleHomeworkSolverTest{
	private final ModuleHomeworkSolver solver=new ModuleHomeworkSolver();
	@Test void containsEverySourceQuestionAndBaseAnswer(){assertThat(ModuleHomeworkSolver.ANSWERS).hasSize(31);assertThat(ModuleHomeworkSolver.ANSWERS.get("Who's On First")).isEqualTo(new ModuleHomeworkSolver.Answer(2,"UHH"));assertThat(ModuleHomeworkSolver.ANSWERS.get("Benedict Cumberbatch")).isEqualTo(new ModuleHomeworkSolver.Answer(3,"BUTT"));}
	@Test void appliesEveryEdgeworkRuleAndWrapsTheAnswer(){BombEntity b=bomb("S1A2BC");b.setIndicators(new HashMap<>(Map.of("FRK",false,"TST",false)));b.replacePortPlates(java.util.List.of(Set.of(PortType.PARALLEL)));b.setDBatteryCount(2);ModuleHomeworkOutput out=success(b,"Complicated Wires");assertThat(out.baseNumber()).isEqualTo(17);assertThat(out.school()).isEqualTo("UNIVERSITY");assertThat(out.button()).isEqualTo(2);}
	@Test void distinguishesAllFourSchoolOffsetsAndLitBobOverridesEverything(){assertThat(success(bomb("BC1DF2"),"Memory").button()).isEqualTo(3);assertThat(success(bomb("A1BC23"),"Memory").button()).isEqualTo(4);BombEntity university=bomb("E9BF23");university.setDBatteryCount(2);assertThat(success(university,"Memory").button()).isEqualTo(1);BombEntity klane=bomb("A9S123");klane.setIndicators(new HashMap<>(Map.of("FRK",false,"STU",false)));klane.replacePortPlates(java.util.List.of(Set.of(PortType.PARALLEL)));klane.setDBatteryCount(2);assertThat(success(klane,"Memory").button()).isEqualTo(2);klane.getIndicators().put("BOB",true);assertThat(success(klane,"Memory").button()).isEqualTo(3);}
	@Test void acceptsPunctuationInsensitiveSubjectAndRejectsUnknown(){assertThat(success(bomb("BC1DF2"),"T words").subject()).isEqualTo("T-Words");assertThat(solver.solve(null,bomb("BC1DF2"),module(),new ModuleHomeworkInput("Geometry"))).isInstanceOf(SolveFailure.class);}
	private ModuleHomeworkOutput success(BombEntity b,String subject){return((SolveSuccess<ModuleHomeworkOutput>)solver.solve(null,b,module(),new ModuleHomeworkInput(subject))).output();}
	private static BombEntity bomb(String serial){BombEntity b=new BombEntity();b.setSerialNumber(serial);b.setIndicators(new HashMap<>());return b;}private static ModuleEntity module(){ModuleEntity m=new ModuleEntity();m.setType(ModuleType.MODULE_HOMEWORK);m.setState(new HashMap<>());m.setSolution(new HashMap<>());return m;}
}
