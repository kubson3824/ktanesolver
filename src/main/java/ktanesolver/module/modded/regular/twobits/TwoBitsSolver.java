
package ktanesolver.module.modded.regular.twobits;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.*;
import ktanesolver.utils.StringUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo (type = ModuleType.TWO_BITS, id = "two_bits", name = "Two Bits", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Convert binary to decimal and set the switches", tags = {
	"binary", "puzzle"})
public class TwoBitsSolver extends AbstractModuleSolver<TwoBitsInput, TwoBitsOutput> {

	private static final String[][] NUMBERS_TO_LETTERS = {{"kb", "dk", "gv", "tk", "pv", "kp", "bv", "vt", "pz", "dt"}, {"ee", "zk", "ke", "ck", "zp", "pp", "tp", "tg", "pd", "pt"},
		{"tz", "eb", "ec", "cc", "cz", "zv", "cv", "gc", "bt", "gt"}, {"bz", "pk", "kz", "kg", "vd", "ce", "vb", "kd", "gg", "dg"}, {"pb", "vv", "ge", "kv", "dz", "pe", "db", "cd", "td", "cb"},
		{"gb", "tv", "kk", "bg", "bp", "vp", "ep", "tt", "ed", "zg"}, {"de", "dd", "ev", "te", "zd", "bb", "pc", "bd", "kc", "zb"}, {"eg", "bc", "tc", "ze", "zc", "gp", "et", "vc", "tb", "vz"},
		{"ez", "ek", "dv", "cg", "ve", "dp", "bk", "pg", "gk", "gz"}, {"kt", "ct", "zz", "vg", "gd", "cp", "be", "zt", "vk", "dc"}};

	private static final int FIRST_STAGE = 1;
	private static final int FINAL_STAGE = 3;
	private static final int MAX_NUMBER = 99;
	private static final int NUMBER_BASE = 10;
	private static final int MODULO_100 = 100;

	@Override
	public SolveResult<TwoBitsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TwoBitsInput input) {
		validateInput(input);

		TwoBitsState state = module.getStateAs(TwoBitsState.class, () -> new TwoBitsState(new ArrayList<>()));

		if(input.stage() == FIRST_STAGE) {
			return handleFirstStage(bomb, module, state);
		}

		return handleSubsequentStages(input, module, state);
	}

	private void validateInput(TwoBitsInput input) {
		if(input.stage() < FIRST_STAGE || input.stage() > FINAL_STAGE) {
			throw new IllegalArgumentException("Stage must be between 1 and 3");
		}
		if(input.number() < 0 || input.number() > MAX_NUMBER) {
			throw new IllegalArgumentException("Number must be between 0 and 99");
		}
	}

	private SolveResult<TwoBitsOutput> handleFirstStage(BombEntity bomb, ModuleEntity module, TwoBitsState state) {
		int calculatedNumber = calculateFirstStageNumber(bomb);
		return processStage(calculatedNumber, module, state, false);
	}

	private SolveResult<TwoBitsOutput> handleSubsequentStages(TwoBitsInput input, ModuleEntity module, TwoBitsState state) {
		boolean isFinalStage = input.stage() == FINAL_STAGE;
		return processStage(input.number(), module, state, isFinalStage);
	}

	private int calculateFirstStageNumber(BombEntity bomb) {
		int serialLetterValue = extractFirstLetterValue(bomb.getSerialNumber());
		int number = serialLetterValue + (bomb.getLastDigit() * bomb.getBatteryCount());

		if(shouldDoubleNumber(bomb)) {
			number *= 2;
		}

		return number > MAX_NUMBER ? number - MODULO_100 : number;
	}

	private int extractFirstLetterValue(String serialNumber) {
		return serialNumber.chars().filter(Character::isLetter).mapToObj(c -> (char)c).map(Character::toUpperCase).findFirst().map(StringUtils::upperLetterToNumber1Based).orElse(0);
	}

	private boolean shouldDoubleNumber(BombEntity bomb) {
		return bomb.hasPort(PortType.STEREO_RCA) && !bomb.hasPort(PortType.RJ45);
	}

	private SolveResult<TwoBitsOutput> processStage(int number, ModuleEntity module, TwoBitsState state, boolean isFinalStage) {
		String letters = resolveNumbersToLetters(number);
		state.stages().add(new TwoBitsStage(number, letters));
		storeTypedState(module, state);

		TwoBitsOutput output = new TwoBitsOutput(letters, List.copyOf(state.stages()));

		return success(output, isFinalStage);
	}

	private String resolveNumbersToLetters(int number) {
		int leftNumber = number / NUMBER_BASE;
		int rightNumber = number % NUMBER_BASE;

		return NUMBERS_TO_LETTERS[leftNumber][rightNumber];
	}
}
