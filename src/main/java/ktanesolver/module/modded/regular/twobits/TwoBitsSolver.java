package ktanesolver.module.modded.regular.twobits;

import com.fasterxml.jackson.core.type.TypeReference;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import ktanesolver.utils.StringUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class TwoBitsSolver implements ModuleSolver<TwoBitsInput, TwoBitsOutput> {

    private static final String[][] NUMBERS_TO_LETTERS = {
            {"kb", "dk", "gv", "tk", "pv", "kp", "bv", "vt", "pz", "dt"},
            {"ee", "zk", "ke", "ck", "zp", "pp", "tp", "tg", "pd", "pt"},
            {"tz", "eb", "ec", "cc", "cz", "zv", "cv", "gc", "bt", "gt"},
            {"bz", "pk", "kz", "kg", "vd", "ce", "vb", "kd", "gg", "dg"},
            {"pb", "vv", "ge", "kv", "dz", "pe", "db", "cd", "td", "cb"},
            {"gb", "tv", "kk", "bg", "bp", "vp", "ep", "tt", "ed", "zg"},
            {"de", "dd", "ev", "te", "zd", "bb", "pc", "bd", "kc", "zb"},
            {"eg", "bc", "tc", "ze", "zc", "gp", "et", "vc", "tb", "vz"},
            {"ez", "ek", "dv", "cg", "ve", "dp", "bk", "pg", "gk", "gz"},
            {"kt", "ct", "zz", "vg", "gd", "cp", "be", "zt", "vk", "dc"}
    };

    private static final int FIRST_STAGE = 1;
    private static final int FINAL_STAGE = 3;
    private static final int MAX_NUMBER = 99;
    private static final int NUMBER_BASE = 10;
    private static final int MODULO_100 = 100;

    @Override
    public ModuleType getType() {
        return ModuleType.TWO_BITS;
    }

    @Override
    public Class<TwoBitsInput> inputType() {
        return TwoBitsInput.class;
    }
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("two_bits", "Two Bits", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"TWO_BITS", List.of("binary", "puzzle"),
			"Convert binary to decimal and set the switches", true, true);
	}

    @Override
    public SolveResult<TwoBitsOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, TwoBitsInput input) {
        validateInput(input);
        
        TwoBitsState state = module.getStateAs(TwoBitsState.class, () -> new TwoBitsState(new ArrayList<>()));
        
        if (input.stage() == FIRST_STAGE) {
            return handleFirstStage(bomb, module, state);
        }
        
        return handleSubsequentStages(input, module, state);
    }

    private void validateInput(TwoBitsInput input) {
        if (input.stage() < FIRST_STAGE || input.stage() > FINAL_STAGE) {
            throw new IllegalArgumentException("Stage must be between 1 and 3");
        }
        if (input.number() < 0 || input.number() > MAX_NUMBER) {
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
        
        if (shouldDoubleNumber(bomb)) {
            number *= 2;
        }
        
        return number > MAX_NUMBER ? number - MODULO_100 : number;
    }

    private int extractFirstLetterValue(String serialNumber) {
        return serialNumber.chars()
                .filter(Character::isLetter)
                .mapToObj(c -> (char) c)
                .map(Character::toUpperCase)
                .findFirst()
                .map(StringUtils::upperLetterToNumber)
                .orElse(0);
    }

    private boolean shouldDoubleNumber(BombEntity bomb) {
        return bomb.hasPort(PortType.STEREO_RCA) && !bomb.hasPort(PortType.RJ45);
    }

    private SolveResult<TwoBitsOutput> processStage(int number, ModuleEntity module, TwoBitsState state, boolean isFinalStage) {
        String letters = resolveNumbersToLetters(number);
        state.stages().add(new TwoBitsStage(number, letters));
        module.setState(state);
        
        TwoBitsOutput output = new TwoBitsOutput(letters);
        saveSolutionToModule(output, module);
        
        if (isFinalStage) {
            module.setSolved(true);
        }
        
        return new SolveSuccess<>(output, isFinalStage);
    }

    private void saveSolutionToModule(TwoBitsOutput output, ModuleEntity module) {
        Map<String, Object> convertedValue = Json.mapper().convertValue(output, new TypeReference<>() {});
        convertedValue.forEach(module.getSolution()::put);
    }

    private String resolveNumbersToLetters(int number) {
        int leftNumber = number / NUMBER_BASE;
        int rightNumber = number % NUMBER_BASE;
        
        return NUMBERS_TO_LETTERS[leftNumber][rightNumber];
    }
}
