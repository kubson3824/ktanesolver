package ktanesolver.module.modded.regular.borderedkeys;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.borderedkeys.BorderedKeysInput.Color;
import ktanesolver.module.modded.regular.borderedkeys.BorderedKeysInput.Key;
import ktanesolver.module.modded.regular.borderedkeys.BorderedKeysOutput.Action;
import ktanesolver.module.modded.regular.souvenir.SouvenirInput;
import ktanesolver.module.modded.regular.souvenir.SouvenirOutput;
import ktanesolver.module.modded.regular.souvenir.SouvenirSolver;

class BorderedKeysSolverTest {
	private final BorderedKeysSolver solver = new BorderedKeysSolver();

	@Test
	void decodesCurrentLayoutAndSupportsTheFinalReset() {
		assertThat(BorderedKeysSolver.value(
			new Key(true, Color.BLUE, Color.MAGENTA, Color.CYAN, 4, 5), 5
		)).isEqualTo(2);
		ModuleEntity module = module(ModuleType.BORDERED_KEYS, false);
		List<Key> keys = new ArrayList<>();
		for (int position = 0; position < 6; position++) keys.add(keyForValue(position, position == 0 ? 1 : 2));

		BorderedKeysOutput output = solve(module, new BorderedKeysInput(0, keys));
		assertThat(output.targetValue()).isEqualTo(1);
		assertThat(output.validPositions()).containsExactly(1);
		assertThat(output.action()).isEqualTo(Action.PRESS);
		assertThat(output.twitchCommand()).isEqualTo("press 1");
		assertThat(module.getState()).containsKey("borderedKeysPressedKeys");

		List<Key> finalLayout = new ArrayList<>();
		for (int position = 0; position < 5; position++) finalLayout.add(inactive());
		finalLayout.add(keyForValue(5, 5));
		ModuleEntity finalModule = module(ModuleType.BORDERED_KEYS, false);
		SolveSuccess<BorderedKeysOutput> finalResult = solveResult(finalModule, new BorderedKeysInput(5, finalLayout));
		assertThat(finalResult.output().action()).isEqualTo(Action.RESET);
		assertThat(finalResult.output().twitchCommand()).isEqualTo("press 0");
		assertThat(finalResult.solved()).isTrue();
	}

	@Test
	void preservesEverySouvenirFactAcrossAReset() {
		ModuleEntity source = module(ModuleType.BORDERED_KEYS, false);
		List<Key> firstLayout = new ArrayList<>();
		for (int position = 0; position < 6; position++) firstLayout.add(keyForValue(position, position == 0 ? 1 : 2));
		solve(source, new BorderedKeysInput(0, firstLayout));

		List<Key> secondLayout = new ArrayList<>();
		secondLayout.add(inactive());
		secondLayout.add(keyForValue(1, 2, Color.BLUE, Color.GREEN, Color.MAGENTA, 4));
		for (int position = 2; position < 6; position++) secondLayout.add(keyForValue(position, 3));
		solve(source, new BorderedKeysInput(1, secondLayout));
		source.setSolved(true);

		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false);
		BombEntity bomb = new BombEntity();
		bomb.setModules(List.of(souvenir, source));
		assertThat(answer(bomb, souvenir, source, "first key border color")).isEqualTo("Red");
		assertThat(answer(bomb, souvenir, source, "first key displayed digit")).isEqualTo(String.valueOf(firstLayout.getFirst().display()));
		assertThat(answer(bomb, souvenir, source, "second key key color")).isEqualTo("Blue");
		assertThat(answer(bomb, souvenir, source, "second key label")).isEqualTo("4");
		assertThat(answer(bomb, souvenir, source, "second key label color")).isEqualTo("Green");
	}

	@SuppressWarnings("unchecked")
	private BorderedKeysOutput solve(ModuleEntity module, BorderedKeysInput input) {
		return solveResult(module, input).output();
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<BorderedKeysOutput> solveResult(ModuleEntity module, BorderedKeysInput input) {
		return (SolveSuccess<BorderedKeysOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	@SuppressWarnings("unchecked")
	private static String answer(BombEntity bomb, ModuleEntity souvenir, ModuleEntity source, String question) {
		return ((SolveSuccess<SouvenirOutput>) new SouvenirSolver().solve(
			new RoundEntity(), bomb, souvenir, new SouvenirInput(source.getId(), question, List.of(), false)
		)).output().answer();
	}

	private static Key keyForValue(int position, int value) {
		return keyForValue(position, value, Color.RED, Color.RED, Color.RED, 1);
	}

	private static Key keyForValue(
		int position, int value, Color keyColor, Color labelColor, Color borderColor, int label
	) {
		for (int display = 1; display <= 6; display++) {
			Key key = new Key(true, keyColor, labelColor, borderColor, label, display);
			if (BorderedKeysSolver.value(key, position) == value) return key;
		}
		throw new AssertionError("No display produced value " + value);
	}

	private static Key inactive() {
		return new Key(false, null, null, null, null, null);
	}

	private static ModuleEntity module(ModuleType type, boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setId(UUID.randomUUID());
		module.setType(type);
		module.setSolved(solved);
		module.setState(new HashMap<>());
		return module;
	}
}
