package ktanesolver.module.modded.regular.one_hundred_and_one_dalmatians;

import java.util.List;

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
	type = ModuleType.ONE_HUNDRED_AND_ONE_DALMATIANS,
	id = "OneHundredAndOneDalmatiansModule",
	name = "101 Dalmatians",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Match the rotated fur pattern to its Dalmatian name.",
	tags = {"dogs", "patterns", "visual", "rotation"}
)
public class OneHundredAndOneDalmatiansSolver extends AbstractModuleSolver<OneHundredAndOneDalmatiansInput, OneHundredAndOneDalmatiansOutput> {
	public static final List<String> NAMES = List.of(
		"Blackear", "Blackie", "Blob", "Blot", "Bon-Bon", "Bravo", "Brownie", "Bulgey", "Bump", "Cadpig", "Corky",
		"D.J.", "Da Vinci", "Dante", "Dash", "Dawkins", "Deja Vu", "Dingo", "Dipper", "Dipstick", "Disco", "Disel",
		"Dolly", "Dorothy", "Dot", "Duke", "Dylan", "Fatty", "Fidget", "Flapper", "Football", "Freckles", "Furrball",
		"Guy", "Growly", "Ham", "Harvey", "Holly", "Hoofer", "Hoover", "Hungry", "Inky", "Jewel", "Jolly", "Kirby",
		"Latch", "Lenny", "Leno", "Lipdip", "Lucky", "Ludo", "Lugnut", "Lumpy", "Missy", "Nosey", "Pandy", "Patches",
		"Penny", "Pepper", "Perdita", "Pickle", "Plato", "Playdoh", "Pointy", "Pokey", "Polly", "Pongo", "Pooh", "Puddles",
		"Purdy", "Queeny", "Roger", "Roly Poly", "Rover", "Sa-Sa", "Salter", "Scooter", "Scottie", "Sleepy", "Smokey", "Sniff",
		"Spanky", "Spark", "Spatter", "Speedy", "Sport", "Spot", "Spotty", "Steve", "Sugar", "Swifty", "Thunder", "Tiger",
		"Tiresome", "Tripod", "Two-Tone", "Wags", "Whitey", "Whizzer", "Yank", "Yoyo"
	);

	@Override
	protected SolveResult<OneHundredAndOneDalmatiansOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, OneHundredAndOneDalmatiansInput input
	) {
		if (input == null || input.patternNumber() == null || input.patternNumber() < 1 || input.patternNumber() > NAMES.size()) {
			return failure("Select one of the 101 fur patterns");
		}
		return success(new OneHundredAndOneDalmatiansOutput(NAMES.get(input.patternNumber() - 1), input.patternNumber()));
	}
}
