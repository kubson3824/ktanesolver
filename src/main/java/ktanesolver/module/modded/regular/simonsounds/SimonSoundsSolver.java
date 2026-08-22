package ktanesolver.module.modded.regular.simonsounds;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
    type = ModuleType.SIMON_SOUNDS,
    id = "simonSounds",
    name = "Simon Sounds",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Translate cumulative sound sequences between shuffled sample and input colors.",
    tags = {"simon", "sounds", "colors", "stages", "edgework"}
)
public class SimonSoundsSolver extends AbstractModuleSolver<SimonSoundsInput, SimonSoundsOutput> {
    private static final List<String> COLORS = List.of("RED", "BLUE", "YELLOW", "GREEN");
    private static final int[][] SAMPLE = {
        {1, 2, 3, 0}, {0, 2, 1, 3}, {3, 0, 2, 1}, {2, 3, 0, 1}, {3, 1, 0, 2}
    };
    private static final int[][] INPUT = {
        {1, 3, 0, 2}, {2, 1, 0, 3}, {0, 3, 1, 2}, {3, 2, 1, 0}, {2, 0, 3, 1}
    };
    private static final String[] SAMPLE_CONDITIONS = {
        "More than 3 port plates", "More AA than D batteries", "Serial has a vowel and an even digit",
        "Lit indicators equal ports", "Otherwise"
    };
    private static final String[] INPUT_CONDITIONS = {
        "More solved than unsolved modules", "Holders + port plates + last serial digit < 10",
        "Serial and parallel ports present", "Lit BOB or unlit NSA", "Otherwise"
    };

    @Override
    protected SolveResult<SimonSoundsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SimonSoundsInput input
    ) {
        if (input == null || input.stage() == null || input.stage() < 1 || input.stage() > 5) return failure("Stage must be from 1 to 5");
        if (input.sampleSequence() == null || input.sampleSequence().size() != input.stage()) return failure("Enter the cumulative sample sequence for this stage");
        if (Boolean.TRUE.equals(input.finalStage()) && input.stage() < 3) return failure("Simon Sounds always has at least 3 stages");
        List<String> samples = new ArrayList<>();
        for (String value : input.sampleSequence()) {
            String color = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
            if (!COLORS.contains(color)) return failure("Sample colors must be red, blue, yellow, or green");
            samples.add(color);
        }
        if (bomb.getSerialNumber() == null || bomb.getSerialNumber().chars().noneMatch(Character::isDigit)) return failure("A serial number containing a digit is required");

        List<String> remembered = remembered(module);
        if (input.stage() > remembered.size() + 1) return failure("Solve the preceding stage first");
        if (input.stage() == remembered.size() + 1) remembered.add(samples.getLast().toLowerCase(Locale.ROOT));
        else remembered.set(input.stage() - 1, samples.getLast().toLowerCase(Locale.ROOT));
        storeState(module, "simonSoundsSamples", remembered);

        int sampleCondition = sampleCondition(bomb);
        int inputCondition = inputCondition(bomb);
        return success(new SimonSoundsOutput(
            input.stage(), presses(sampleCondition, inputCondition, samples),
            SAMPLE_CONDITIONS[sampleCondition], INPUT_CONDITIONS[inputCondition]
        ), Boolean.TRUE.equals(input.finalStage()));
    }

    static List<String> presses(int sampleCondition, int inputCondition, List<String> samples) {
        return samples.stream().map(COLORS::indexOf)
            .map(index -> COLORS.get(INPUT[inputCondition][SAMPLE[sampleCondition][index]])).toList();
    }

    static int sampleCondition(BombEntity bomb) {
        if (bomb.getPortPlates().size() > 3) return 0;
        if (bomb.getAaBatteryCount() > bomb.getDBatteryCount()) return 1;
        String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
        if (serial.chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0) && serial.chars().anyMatch(c -> Character.isDigit(c) && (c - '0') % 2 == 0)) return 2;
        int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
        return lit == ports ? 3 : 4;
    }

    static int inputCondition(BombEntity bomb) {
        long solved = bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
        if (solved > bomb.getModules().size() - solved) return 0;
        int lastDigit = bomb.getSerialNumber().chars().filter(Character::isDigit).reduce((first, last) -> last).orElseThrow() - '0';
        if (bomb.getBatteryHolders() + bomb.getPortPlates().size() + lastDigit < 10) return 1;
        if (bomb.hasPort(PortType.SERIAL) && bomb.hasPort(PortType.PARALLEL)) return 2;
        if (Boolean.TRUE.equals(bomb.getIndicators().get("BOB")) || Boolean.FALSE.equals(bomb.getIndicators().get("NSA"))) return 3;
        return 4;
    }

    private static List<String> remembered(ModuleEntity module) {
        List<String> result = new ArrayList<>();
        Object raw = module.getState().get("simonSoundsSamples");
        if (raw instanceof List<?> list) list.stream().filter(String.class::isInstance).map(String.class::cast).forEach(result::add);
        return result;
    }
}
