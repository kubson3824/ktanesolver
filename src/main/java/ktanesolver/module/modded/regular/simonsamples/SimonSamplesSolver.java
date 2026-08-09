package ktanesolver.module.modded.regular.simonsamples;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

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
@ModuleInfo(
	type = ModuleType.SIMON_SAMPLES,
	id = "simonSamples",
	name = "Simon Samples",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Transform each four-sound call addition and record the cumulative response.",
	tags = {"simon", "sounds", "stages", "drums"}
)
public class SimonSamplesSolver extends AbstractModuleSolver<SimonSamplesInput, SimonSamplesOutput> {
	private static final List<List<String>> POSSIBLE = List.of(
		List.of("KKSH", "KSSH", "KHSH", "KHSO"),
		List.of("KKSS", "KHSS", "KOSH", "KOSO"),
		List.of("KKSS", "SKSK", "SHHS", "KHSH")
	);

	@Override
	protected SolveResult<SimonSamplesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonSamplesInput input
	) {
		if (input == null || input.stage() < 1 || input.stage() > 3) return failure("Stage must be 1, 2, or 3");
		if (bomb.getSerialNumber() == null) return failure("Bomb serial number is required");
		String call = normalize(input.call());
		if (call.length() != input.stage() * 4 || !call.matches("[KSHO]+"))
			return failure("Call must contain four sounds per completed stage using K, S, H, and O");
		for (int stage = 0; stage < input.stage(); stage++) {
			String part = call.substring(stage * 4, stage * 4 + 4);
			if (!POSSIBLE.get(stage).contains(part)) return failure("Call addition for stage " + (stage + 1) + " is not possible");
			storeState(module, "callStage" + (stage + 1), part);
		}
		if (input.padSounds() == null || input.padSounds().size() != 4) return failure("Identify the sound on each of the four pads");
		List<String> pads = input.padSounds().stream().map(SimonSamplesSolver::normalize).toList();
		if (pads.stream().anyMatch(sound -> !sound.matches("[KSHO]")) || new HashSet<>(pads).size() != 4)
			return failure("Pad sounds must be K, S, H, and O exactly once");

		StringBuilder response = new StringBuilder();
		for (int stage = 0; stage < input.stage(); stage++)
			response.append(apply(bomb, call.substring(0, stage * 4 + 4), stage));
		List<String> sounds = response.chars().mapToObj(value -> String.valueOf((char) value)).toList();
		List<Integer> presses = sounds.stream().map(sound -> pads.indexOf(sound) + 1).toList();
		return success(new SimonSamplesOutput(input.stage(), sounds, presses), input.stage() == 3);
	}

	static String apply(BombEntity bomb, String call, int stage) {
		char[] part = call.substring(stage * 4, stage * 4 + 4).toCharArray();
		if (stage == 0) {
			int serialSum = bomb.getSerialNumber().chars().filter(Character::isDigit).map(value -> value - '0').sum() % 10;
			if (serialSum < 5) part[1] = part[1] == 'S' ? 'O' : 'S';
			else for (int i = 0; i < 4; i++) part[i] = part[i] == 'H' ? 'O' : part[i] == 'O' ? 'H' : part[i];
		} else if (stage == 1) {
			part = call.indexOf('O') >= 0
				? new char[] {part[2], part[3], part[0], part[1]}
				: new char[] {part[3], part[2], part[1], part[0]};
		} else if (call.chars().filter(value -> value == 'H').count() >= 3) part[0] = 'O';
		else for (int i = 0; i < 4; i++) part[i] = part[i] == 'K' ? 'S' : part[i] == 'S' ? 'K' : part[i];
		return new String(part);
	}

	private static String normalize(String value) {
		if (value == null) return "";
		return value.toUpperCase(Locale.ROOT).replace("KICK", "K").replace("SNARE", "S")
			.replace("OPENHIHAT", "O").replace("HIHAT", "H").replaceAll("[^KSHO]", "");
	}
}
