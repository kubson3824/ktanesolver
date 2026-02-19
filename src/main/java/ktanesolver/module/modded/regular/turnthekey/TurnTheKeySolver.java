package ktanesolver.module.modded.regular.turnthekey;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(type = ModuleType.TURN_THE_KEY, id = "turnthekey", name = "Turn The Key", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Turn the key when the bomb's timer matches the time on the display", tags = {
	"timing", "display" }, checkFirst = true)
public class TurnTheKeySolver extends AbstractModuleSolver<TurnTheKeyInput, TurnTheKeyOutput> {

	private static final int MAX_SECONDS = 99 * 60 + 59;

	@Override
	public SolveResult<TurnTheKeyOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TurnTheKeyInput input) {
		int seconds = input.displayTimeSeconds();
		if (seconds < 0 || seconds > MAX_SECONDS) {
			return failure("Display time must be between 0 and 99:59 (0–5999 seconds)");
		}
		String formatted = formatMmSs(seconds);
		String instruction = "Turn the key when the timer shows " + formatted;
		return success(new TurnTheKeyOutput(seconds, instruction));
	}

	private static String formatMmSs(int totalSeconds) {
		int minutes = totalSeconds / 60;
		int seconds = totalSeconds % 60;
		return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
	}
}
