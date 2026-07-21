package ktanesolver.module.modded.regular.algebra;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class AlgebraSolverTest {
	private final AlgebraSolver solver = new AlgebraSolver();

	@ParameterizedTest
	@MethodSource("stageOneEquations")
	void solvesEveryStageOneEquation(String equation, String expected) {
		ModuleEntity module = new ModuleEntity();
		assertThat(solve(sourceBomb(module), module, equation).output())
			.isEqualTo(new AlgebraOutput(1, equation, expected));
	}

	@ParameterizedTest
	@MethodSource("stageTwoEquations")
	void solvesEveryStageTwoEquation(String equation, String expected) {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = sourceBomb(module);
		solve(bomb, module, "a=x+1");

		assertThat(solve(bomb, module, equation).output())
			.isEqualTo(new AlgebraOutput(2, equation, expected));
	}

	@ParameterizedTest
	@MethodSource("stageThreeEquations")
	void solvesEveryStageThreeEquation(String equation, String expected) {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = sourceBomb(module);
		solve(bomb, module, "a=x+1");
		solve(bomb, module, "b=xyz");

		assertThat(solve(bomb, module, equation).output())
			.isEqualTo(new AlgebraOutput(3, equation, expected));
	}

	@Test
	void solvesAllThreeStagesWithSourceAccurateEdgeworkAndPersistsSouvenirEquations() {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = sourceBomb(module);

		SolveSuccess<AlgebraOutput> first = solve(bomb, module, "a=x/2");
		assertThat(first.output()).isEqualTo(new AlgebraOutput(1, "a=x/2", "4"));
		assertThat(first.solved()).isFalse();
		assertThat(module.getState()).containsEntry("x", "8").containsEntry("y", "-2").containsEntry("z", "6");

		SolveSuccess<AlgebraOutput> second = solve(bomb, module, "b=(x+y)-(z/2)");
		assertThat(second.output()).isEqualTo(new AlgebraOutput(2, "b=(x+y)-(z/2)", "3"));
		assertThat(second.solved()).isFalse();

		SolveSuccess<AlgebraOutput> third = solve(bomb, module, "x(y/2)+11=(4+c)/2y");
		assertThat(third.output()).isEqualTo(new AlgebraOutput(3, "x(y/2)+11=(4+c)/2y", "-16"));
		assertThat(third.solved()).isTrue();
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState())
			.containsEntry("firstEquation", "a=x/2")
			.containsEntry("secondEquation", "b=(x+y)-(z/2)")
			.containsEntry("equations", List.of("a=x/2", "b=(x+y)-(z/2)", "x(y/2)+11=(4+c)/2y"));
	}

	@Test
	void appliesPrimeAndNoHolderRulesAndKeepsExactDecimals() {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("BC0003");
		bomb.setIndicators(Map.of());
		bomb.setModules(List.of(module));

		assertThat(solve(bomb, module, " a = z / 10 ").output())
			.isEqualTo(new AlgebraOutput(1, "a=z/10", "0.5"));
		assertThat(module.getState()).containsEntry("x", "3").containsEntry("y", "2").containsEntry("z", "5");
	}

	@Test
	void rejectsAnEquationFromTheWrongStageWithoutChangingProgress() {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setIndicators(Map.of());
		bomb.setModules(List.of(module));

		assertThat(solver.solve(new RoundEntity(), bomb, module, new AlgebraInput("b=xyz")))
			.isInstanceOf(SolveFailure.class);
		assertThat(module.getState()).isEmpty();
		assertThat(solve(bomb, module, "a=x+1").output().stage()).isEqualTo(1);
		assertThat(solver.solve(new RoundEntity(), bomb, module, new AlgebraInput("a=7x")))
			.isInstanceOf(SolveFailure.class);
		assertThat(module.getState().get("equations")).isEqualTo(List.of("a=x+1"));
	}

	@Test
	void rejectsTheSourceExcludedDivisionByZeroEquation() {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("BC0006");
		bomb.setIndicators(Map.of("CAR", false, "FRK", false));
		bomb.setModules(List.of(module));
		solve(bomb, module, "a=x+1");
		solve(bomb, module, "b=xyz");

		assertThat(solver.solve(new RoundEntity(), bomb, module,
			new AlgebraInput("x(y/2)+11=(4+c)/2y")))
			.isInstanceOf(SolveFailure.class);
		assertThat(module.getState().get("equations")).isEqualTo(List.of("a=x+1", "b=xyz"));
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<AlgebraOutput> solve(BombEntity bomb, ModuleEntity module, String equation) {
		return (SolveSuccess<AlgebraOutput>) solver.solve(
			new RoundEntity(), bomb, module, new AlgebraInput(equation)
		);
	}

	private static BombEntity sourceBomb(ModuleEntity module) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AE1B23");
		bomb.setAaBatteryCount(4);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("BOB", true, "FRQ", false, "MSA", true));
		bomb.replacePortPlates(List.of(Set.of(PortType.RJ45, PortType.SERIAL, PortType.PARALLEL)));
		bomb.setModules(List.of(module, new ModuleEntity(), new ModuleEntity(), new ModuleEntity(), new ModuleEntity()));
		return bomb;
	}

	private static Stream<Arguments> stageOneEquations() {
		return Stream.of(
			Arguments.of("a=x+1", "9"),
			Arguments.of("a=6-x", "-2"),
			Arguments.of("a=7x", "56"),
			Arguments.of("a=x/2", "4"),
			Arguments.of("a=5+y", "3"),
			Arguments.of("a=y-2", "-4"),
			Arguments.of("a=8y", "-16"),
			Arguments.of("a=y/4", "-0.5"),
			Arguments.of("a=9+z", "15"),
			Arguments.of("a=z-7", "-1"),
			Arguments.of("a=3z", "18"),
			Arguments.of("a=z/10", "0.6")
		);
	}

	private static Stream<Arguments> stageTwoEquations() {
		return Stream.of(
			Arguments.of("b=xy-(2+x)", "-26"),
			Arguments.of("b=(2x/10)-y", "3.6"),
			Arguments.of("b=(z-y)/2", "4"),
			Arguments.of("b=xyz", "-96"),
			Arguments.of("b=(y/2)-z", "-7"),
			Arguments.of("b=(zy)-(2x)", "-28"),
			Arguments.of("b=(x+y)-(z/2)", "3"),
			Arguments.of("b=(7x)y", "-112"),
			Arguments.of("b=2z+7", "19"),
			Arguments.of("b=2(z+7)", "26")
		);
	}

	private static Stream<Arguments> stageThreeEquations() {
		return Stream.of(
			Arguments.of("x-2y=c-z", "18"),
			Arguments.of("xy=z+(c/10)", "-220"),
			Arguments.of("(y/2)+7=4c+z", "0"),
			Arguments.of("8x-z=c-y", "56"),
			Arguments.of("3x-(2+y)/10=z/4-c", "-22.5"),
			Arguments.of("9y/2=c-xy/4", "-13"),
			Arguments.of("x(y/2)+11=(4+c)/2y", "-16"),
			Arguments.of("z/2-x/4=4c-z", "1.75")
		);
	}
}
