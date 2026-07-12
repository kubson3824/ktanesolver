package ktanesolver.module.modded.regular.rockpaperscissorslizardspock;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.function.ToIntFunction;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.ROCK_PAPER_SCISSORS_LIZARD_SPOCK,
	id = "rock-paper-scissors-lizard-spock",
	name = "Rock-Paper-Scissors-Lizard-Spock",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Score edgework to determine which signs to press",
	tags = {"signs", "edgework", "modded"}
)
public class RockPaperScissorsLizardSpockSolver extends AbstractModuleSolver<RockPaperScissorsLizardSpockInput, RockPaperScissorsLizardSpockOutput> {
	private enum Sign {
		ROCK, PAPER, SCISSORS, LIZARD, SPOCK;

		boolean beats(Sign other) {
			return switch (this) {
				case ROCK -> other == LIZARD || other == SCISSORS;
				case PAPER -> other == ROCK || other == SPOCK;
				case SCISSORS -> other == PAPER || other == LIZARD;
				case LIZARD -> other == SPOCK || other == PAPER;
				case SPOCK -> other == SCISSORS || other == ROCK;
			};
		}
	}

	@Override
	protected SolveResult<RockPaperScissorsLizardSpockOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, RockPaperScissorsLizardSpockInput input
	) {
		Sign decoy;
		try {
			decoy = input == null || input.decoy() == null || input.decoy().isBlank() || input.decoy().equalsIgnoreCase("NONE")
				? null : Sign.valueOf(input.decoy().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			return failure("Decoy must be Rock, Paper, Scissors, Lizard, Spock, or None");
		}
		storeState(module, "decoy", decoy == null ? "NONE" : decoy.name());

		String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		List<Row> rows = List.of(
			new Row("serial number letters", !serial.matches(".*[XY].*"), sign -> count(serial, switch (sign) {
				case ROCK -> "RO"; case PAPER -> "PA"; case SCISSORS -> "SI"; case LIZARD -> "LZ"; case SPOCK -> "CK";
			})),
			new Row("ports", !bomb.hasPort(PortType.PS2), sign -> countPorts(bomb, switch (sign) {
				case ROCK -> PortType.RJ45; case PAPER -> PortType.PARALLEL; case SCISSORS -> PortType.SERIAL;
				case LIZARD -> PortType.DVI; case SPOCK -> PortType.STEREO_RCA;
			})),
			new Row("lit indicators", !bomb.isIndicatorLit("TRN"), sign -> countIndicators(bomb, true, switch (sign) {
				case ROCK -> List.of("FRK", "FRQ"); case PAPER -> List.of("BOB", "IND"); case SCISSORS -> List.of("CAR", "SIG");
				case LIZARD -> List.of("CLR", "NSA"); case SPOCK -> List.of("SND", "MSA");
			})),
			new Row("unlit indicators", !bomb.isIndicatorUnlit("TRN"), sign -> countIndicators(bomb, false, switch (sign) {
				case ROCK -> List.of("FRK", "FRQ"); case PAPER -> List.of("BOB", "IND"); case SCISSORS -> List.of("CAR", "SIG");
				case LIZARD -> List.of("CLR", "NSA"); case SPOCK -> List.of("SND", "MSA");
			})),
			new Row("serial number digits", true, sign -> count(serial, switch (sign) {
				case ROCK -> "05"; case PAPER -> "36"; case SCISSORS -> "19"; case LIZARD -> "28"; case SPOCK -> "47";
			}))
		);

		for (Row row : rows) {
			Sign target = row.enabled() ? uniqueWinner(row.score()) : null;
			if (target != null && target != decoy) return success(output(target, row.name()));
		}
		List<String> signs = Arrays.stream(Sign.values()).filter(sign -> sign != decoy).map(Sign::name).toList();
		return success(new RockPaperScissorsLizardSpockOutput(null, signs, "no applicable scoring row"));
	}

	private static RockPaperScissorsLizardSpockOutput output(Sign target, String rule) {
		return new RockPaperScissorsLizardSpockOutput(target.name(),
			Arrays.stream(Sign.values()).filter(sign -> sign.beats(target)).map(Sign::name).toList(), rule);
	}

	private static Sign uniqueWinner(ToIntFunction<Sign> score) {
		int highest = Arrays.stream(Sign.values()).mapToInt(score).max().orElse(0);
		List<Sign> winners = Arrays.stream(Sign.values()).filter(sign -> score.applyAsInt(sign) == highest).toList();
		return winners.size() == 1 ? winners.getFirst() : null;
	}

	private static int count(String value, String matches) {
		return (int)value.chars().filter(character -> matches.indexOf(character) >= 0).count();
	}

	private static int countPorts(BombEntity bomb, PortType port) {
		return (int)bomb.getPortPlates().stream().filter(plate -> plate.getPorts().contains(port)).count();
	}

	private static int countIndicators(BombEntity bomb, boolean lit, List<String> labels) {
		return (int)labels.stream().filter(label -> lit ? bomb.isIndicatorLit(label) : bomb.isIndicatorUnlit(label)).count();
	}

	private record Row(String name, boolean enabled, ToIntFunction<Sign> score) {}
}
