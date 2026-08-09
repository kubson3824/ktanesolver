package ktanesolver.module.modded.regular.alphabetnumbers;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
	type = ModuleType.ALPHABET_NUMBERS,
	id = "alphabetNumbers",
	name = "Alphabet Numbers",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Order six table entries by the English names of their numbers across four stages.",
	tags = {"numbers", "alphabetical", "buttons", "multi-stage"}
)
public class AlphabetNumbersSolver extends AbstractModuleSolver<AlphabetNumbersInput, AlphabetNumbersOutput> {
	private static final long[][] TABLES = {
		{8,18,28,38,48,58,68,78,80,81,82,83,84,85,86,87,88,89,800,808,818,888},
		{6,7,16,17,60,66,67,70,76,77,600,606,607,660,666,667,670,676,677,700,706,707,760,766,767,770,776,777},
		{4,5,14,15,40,44,45,50,54,55,400,404,405,440,444,445,450,454,455,500,504,505,540,544,545,550,554,555},
		{2,3,10,12,13,20,22,23,30,32,33,200,202,203,220,222,223,230,232,233,300,302,303,320,322,323,330,332,333,1000,10000,1000000000000L}
	};
	private static final String[] SMALL = {
		"zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"
	};
	private static final String[] TENS = {"","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"};

	@Override
	protected SolveResult<AlphabetNumbersOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, AlphabetNumbersInput input
	) {
		int stage = module.getState().get("nextStage") instanceof Number number ? number.intValue() : 1;
		if (stage < 1 || stage > 4) return failure("The stored Alphabet Numbers stage is invalid");
		if (input == null || input.labels() == null || input.labels().size() != 6) {
			return failure("Enter all six button labels");
		}
		int limit = TABLES[stage - 1].length;
		if (input.labels().stream().anyMatch(label -> label == null || label < 1 || label > limit)
			|| new HashSet<>(input.labels()).size() != 6) {
			return failure("Stage " + stage + " needs six different labels from 1 through " + limit);
		}

		List<Integer> positions = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
		positions.sort(Comparator.comparing(position -> numberName(TABLES[stage - 1][input.labels().get(position - 1) - 1])));
		storeState(module, "stage" + stage + "Numbers", List.copyOf(input.labels()));
		int nextStage = Math.min(4, stage + 1);
		storeState(module, "nextStage", nextStage);
		AlphabetNumbersOutput output = new AlphabetNumbersOutput(stage, List.copyOf(positions), nextStage);
		return stage == 4 ? success(output) : success(output, false);
	}

	static String numberName(long value) {
		if (value == 1_000) return "thousand";
		if (value == 10_000) return "ten thousand";
		if (value == 1_000_000_000_000L) return "trillion";
		if (value < 20) return SMALL[(int) value];
		if (value < 100) return TENS[(int) value / 10] + (value % 10 == 0 ? "" : " " + SMALL[(int) value % 10]);
		return SMALL[(int) value / 100] + " hundred" + (value % 100 == 0 ? "" : " and " + numberName(value % 100));
	}
}
