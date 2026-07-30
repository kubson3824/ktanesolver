package ktanesolver.module.modded.regular.jewelvault;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.GreekLetter;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.Jewel;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.Wheel;

class JewelVaultSolverTest {
	@Test
	void selectsJewelsBreaksAbundanceTieSolvesLinkedWheelsAndRecordsSouvenirAnswer() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC120");
		ModuleEntity module = new ModuleEntity();
		JewelVaultInput input = new JewelVaultInput(List.of(
			wheel(GreekLetter.ALPHA, GreekLetter.ALPHA, Jewel.AMETHYST, Jewel.EMERALD, Jewel.GLASS, Jewel.ONYX),
			wheel(GreekLetter.ETA, GreekLetter.ETA, Jewel.RUBY, Jewel.SAPPHIRE, Jewel.POUDRETTEITE, Jewel.SCAPOLITE),
			wheel(GreekLetter.NU, GreekLetter.NU, Jewel.ONYX, Jewel.GLASS, Jewel.EMERALD, Jewel.SCAPOLITE),
			wheel(GreekLetter.TAU, GreekLetter.TAU, Jewel.ONYX, Jewel.AMETHYST, Jewel.RUBY, Jewel.GLASS)
		), List.of(3, 1, 4, 2));

		@SuppressWarnings("unchecked")
		JewelVaultOutput output = ((SolveSuccess<JewelVaultOutput>) new JewelVaultSolver()
			.solve(new RoundEntity(), bomb, module, input)).output();

		assertThat(output).isEqualTo(new JewelVaultOutput(
			List.of(Jewel.EMERALD, Jewel.RUBY, Jewel.SCAPOLITE, Jewel.ONYX),
			"North",
			List.of("reset", "turn 1 3", "submit")
		));
		assertThat(module.getState().get("wheelTurns")).isEqualTo(List.of("3", "4", "none", "1"));
	}

	private static Wheel wheel(GreekLetter first, GreekLetter second, Jewel... jewels) {
		return new Wheel(List.of(jewels), first, second);
	}
}
