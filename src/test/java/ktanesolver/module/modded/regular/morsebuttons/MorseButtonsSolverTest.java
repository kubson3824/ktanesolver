package ktanesolver.module.modded.regular.morsebuttons;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class MorseButtonsSolverTest {
	private final MorseButtonsSolver solver = new MorseButtonsSolver();

	@Test
	void decodesMorseEvaluatesRulesAndPersistsEverySouvenirFact() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("AAAAAA");
		ModuleEntity module = module();
		var buttons = List.of(".-",".-",".-",".-",".-",".-").stream().map(code -> new MorseButtonsInput.Button("red", code)).toList();
		MorseButtonsOutput output = solve(bomb, module, new MorseButtonsInput(buttons));
		assertThat(output.ruleNumbers()).containsOnly(2); assertThat(output.pressPositions()).containsExactly(1, 2, 3, 4, 5, 6);
		assertThat(module.getState()).containsKeys("morseButtonsCharacters", "morseButtonsColors");
	}

	@Test
	void rejectsUnknownMorse() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123");
		var buttons = List.of(new MorseButtonsInput.Button("red", "......"), new MorseButtonsInput.Button("red", "."), new MorseButtonsInput.Button("red", "."), new MorseButtonsInput.Button("red", "."), new MorseButtonsInput.Button("red", "."), new MorseButtonsInput.Button("red", "."));
		assertThat(solver.solve(new RoundEntity(), bomb, module(), new MorseButtonsInput(buttons))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked") private MorseButtonsOutput solve(BombEntity bomb, ModuleEntity module, MorseButtonsInput input) { return ((SolveSuccess<MorseButtonsOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output(); }
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
}
