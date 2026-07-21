package ktanesolver.module.modded.regular.identityparade;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Attire;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Build;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.HairColor;
import ktanesolver.module.modded.regular.identityparade.IdentityParadeInput.Suspect;

class IdentityParadeSolverTest {
	private final IdentityParadeSolver solver = new IdentityParadeSolver();
	private final ModuleEntity module = new ModuleEntity();

	@Test
	void findsTheOnlyDisplayedSuspectWithAllThreeListedTraitsAndRecordsSouvenirFacts() {
		IdentityParadeInput input = input(List.of(
			Suspect.ANDY, Suspect.CHRISSIE, Suspect.DYLAN, Suspect.GEMMA, Suspect.HARRIET,
			Suspect.JAMES, Suspect.KAYLEIGH, Suspect.LOUISE, Suspect.NATE
		));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, input))
			.isEqualTo(new SolveSuccess<>(new IdentityParadeOutput(
				Suspect.ANDY, HairColor.BROWN, Build.HUNCHED, Attire.SUIT), true));
		assertThat(module.getState()).containsEntry("hairColors", input.hairColors())
			.containsEntry("builds", input.builds()).containsEntry("attires", input.attires());
	}

	@Test
	void rejectsAmbiguousAndDuplicateDisplays() {
		IdentityParadeInput ambiguous = input(List.of(
			Suspect.ANDY, Suspect.FIONA, Suspect.CHRISSIE, Suspect.DYLAN, Suspect.GEMMA,
			Suspect.HARRIET, Suspect.JAMES, Suspect.KAYLEIGH, Suspect.NATE
		));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, ambiguous)).isInstanceOf(SolveFailure.class);

		IdentityParadeInput duplicate = new IdentityParadeInput(
			List.of(HairColor.BROWN, HairColor.BROWN, HairColor.WHITE), ambiguous.builds(), ambiguous.attires(), ambiguous.suspects());
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, duplicate)).isInstanceOf(SolveFailure.class);
	}

	private static IdentityParadeInput input(List<Suspect> suspects) {
		return new IdentityParadeInput(
			List.of(HairColor.BROWN, HairColor.GREY, HairColor.WHITE),
			List.of(Build.HUNCHED, Build.TALL, Build.SLIM),
			List.of(Attire.SUIT, Attire.HOODIE, Attire.JUMPER),
			suspects
		);
	}
}
