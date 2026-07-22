package ktanesolver.module.modded.regular.theiphone;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.theiphone.TheIPhoneInput.Action;
import ktanesolver.module.modded.regular.theiphone.TheIPhoneInput.Message;
import ktanesolver.module.modded.regular.theiphone.TheIPhoneInput.TinderProfile;

class TheIPhoneSolverTest {
	private final TheIPhoneSolver solver = new TheIPhoneSolver();
	private final ModuleEntity module = new ModuleEntity();
	private final BombEntity bomb = new BombEntity();

	@Test
	void solvesEveryAppPersistsThePinAndHandlesTinderReset() {
		bomb.setAaBatteryCount(3);
		assertThat(TheIPhoneSolver.angryBirdsPress(List.of(
			"YELLOW_ANGRY_BIRD", "RED_ANGRY_BIRD", "HELMET_PIG", "BLACK_ANGRY_BIRD"), 3, 0)).isEqualTo("TOP_RIGHT");
		assertThat(TheIPhoneSolver.angryBirdsPress(List.of(
			"REGULAR_PIG", "WHITE_ANGRY_BIRD", "KING_PIG", "BLACK_ANGRY_BIRD"), 0, 3)).isEqualTo("BOTTOM_LEFT");

		solve(new TheIPhoneInput(Action.RECORD_DIGIT, null, null, null, null, 1, 7));
		TheIPhoneOutput messages = solve(new TheIPhoneInput(Action.MESSAGES, null, List.of(
			new Message("PHIL", "ROB", 0), new Message("ROB", "ROB", 2),
			new Message("MICK", "ANDY", 6), new Message("ANDY", "PHIL", 9)), null, null, null, null));
		assertThat(messages.pinDigits()).containsExactly(7, 2, null, null);
		solve(new TheIPhoneInput(Action.PHOTOS, null, null, 5, null, null, null));

		bomb.setStrikes(1);
		TinderProfile profile = new TinderProfile("Kate", 24, "GEMINI", "GOLF", "CAT");
		assertThat(TheIPhoneSolver.tinderScore(profile, 1)).isEqualTo(0);
		assertThat(solve(new TheIPhoneInput(Action.TINDER, null, null, null, profile, null, null)).swipeDirection()).isEqualTo("LEFT");
		solve(new TheIPhoneInput(Action.RESET_TINDER, null, null, null, null, null, null));
		assertThat(module.getState().get("tinderProgress")).isEqualTo(0);

		TheIPhoneOutput solved = solve(new TheIPhoneInput(Action.RECORD_DIGIT, null, null, null, null, 4, 9));
		assertThat(solved.pin()).isEqualTo("7259");
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("pinDigits")).isEqualTo(List.of(7, 2, 5, 9));
	}

	@SuppressWarnings("unchecked")
	private TheIPhoneOutput solve(TheIPhoneInput input) {
		return ((SolveSuccess<TheIPhoneOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}
}
