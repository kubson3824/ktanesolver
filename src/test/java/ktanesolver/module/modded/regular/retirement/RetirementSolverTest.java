package ktanesolver.module.modded.regular.retirement;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class RetirementSolverTest {
	private final RetirementSolver solver = new RetirementSolver();

	@Test
	void derivesFamilyFromEveryKindOfEdgeworkAndCountsRepeatedHomeLetters() {
		BombEntity bomb = bomb("A2B3C4");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("BOB", true, "CAR", false));
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.RJ45), Set.of(PortType.SERIAL)));
		RetirementOutput out = solve(bomb, new ModuleEntity(), List.of("Sunnydale", "Sunnyside", "Riverwell", "Broadwood", "Homestead"));
		assertThat(out.wife()).isEqualTo("Sandi");
		assertThat(out.child()).isEqualTo("Kirsty");
		assertThat(out.sibling()).isEqualTo("Mike");
		assertThat(out.scores().stream().filter(score -> score.home().equals("Sunnyside")).findFirst().orElseThrow().wifeScore()).isEqualTo(18);
	}

	@Test
	void implementsAllSevenSiblingRows() {
		List<String> serials = List.of("1A0000", "2A0000", "A10000", "A20000", "BC0000", "AB0000", "120000");
		List<String> names = List.of("Frank", "Jane", "Lydia", "Mike", "Pat", "Skye", "Toby");
		for (int i = 0; i < serials.size(); i++) {
			assertThat(solve(bomb(serials.get(i)), new ModuleEntity(), homes()).sibling()).isEqualTo(names.get(i));
		}
	}

	@Test
	void reproducesTheShippedAllHomesWifeTieBreakAndRecordsOnlyFinalUnchosenHomes() {
		ModuleEntity module = new ModuleEntity();
		List<String> offered = List.of("Briar Hollow", "Broadwood", "Homestead", "Hotham Place", "Riverside");
		RetirementOutput out = solve(bomb("1A0000"), module, offered);
		assertThat(out.tieBreakApplied()).isTrue();
		assertThat(out.scores().stream().filter(score -> score.home().equals("Briar Hollow")).findFirst().orElseThrow().total()).isEqualTo(19);
		assertThat(out.scores().stream().filter(score -> score.home().equals("Hotham Place")).findFirst().orElseThrow().total()).isEqualTo(22);
		assertThat(out.home()).isEqualTo("Briar Hollow");
		assertThat(module.getState().get("retirementUnchosenHomes")).isEqualTo(List.of("Broadwood", "Homestead", "Hotham Place", "Riverside"));
	}

	@Test
	void acceptsCanonicalNamesCaseInsensitivelyAndRejectsInvalidSelections() {
		assertThat(solve(bomb("120000"), new ModuleEntity(), List.of("briar hollow", "BROADWOOD", "Homestead", "Hotham Place", "Leafy Green")).scores())
			.extracting(RetirementOutput.HomeScore::home).containsExactly("Briar Hollow", "Broadwood", "Homestead", "Hotham Place", "Leafy Green");
		assertThat(solver.solve(new RoundEntity(), bomb("120000"), new ModuleEntity(), new RetirementInput(List.of("Homestead", "Homestead", "Broadwood", "Riverwell", "Sunnyside"))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb("120000"), new ModuleEntity(), new RetirementInput(List.of("Homestead", "Broadwood", "Riverwell", "Sunnyside", "Castle"))))
			.isInstanceOf(SolveFailure.class);
	}

	private static List<String> homes() {
		return List.of("Briar Hollow", "Broadwood", "Homestead", "Hotham Place", "Leafy Green");
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}

	@SuppressWarnings("unchecked")
	private RetirementOutput solve(BombEntity bomb, ModuleEntity module, List<String> homes) {
		return ((SolveSuccess<RetirementOutput>) solver.solve(new RoundEntity(), bomb, module, new RetirementInput(homes))).output();
	}
}
