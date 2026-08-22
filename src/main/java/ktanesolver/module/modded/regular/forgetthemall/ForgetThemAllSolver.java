package ktanesolver.module.modded.regular.forgetthemall;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
    type = ModuleType.FORGET_THEM_ALL, id = "forgetThemAll", name = "Forget Them All",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Apply broken-LED corrections to the recorded stages, find the key stage, and derive the wire cut order.",
    tags = {"boss module", "memory", "leds", "wires", "edgework"}
)
public class ForgetThemAllSolver extends AbstractModuleSolver<ForgetThemAllInput, ForgetThemAllOutput> {
    private static final List<String> COLORS = List.of("yellow","grey","blue","green","orange","red","lime","cyan","brown","white","purple","magenta","pink");
    private static final List<List<String>> BROKEN_WORDS = List.of(
        List.of("wire"),List.of("button","key"),List.of("maze"),List.of("simon"),List.of("morse"),
        List.of("cruel","complicated","broken","cursed","faulty"),List.of("math","number","digit","equation","logic"),
        List.of("word","letter","phrase","text","talk","alphabet"),List.of("code","cipher"),List.of("light","led"),
        List.of("square","circle","triangle","cube","sphere"),List.of("color","colour"),List.of("melody","harmony","chord","piano")
    );

    @Override
    protected SolveResult<ForgetThemAllOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ForgetThemAllInput input) {
        if (input == null || input.startingBombMinutes() < 0 || input.stages() == null || input.stages().isEmpty())
            return failure("Enter the starting bomb time in whole minutes and at least one stage");
        int[] totals = new int[13];
        for (int stageIndex = 0; stageIndex < input.stages().size(); stageIndex++) {
            ForgetThemAllInput.Stage stage = input.stages().get(stageIndex);
            if (stage == null || stage.moduleName() == null || stage.moduleName().isBlank() || stage.litLeds() == null)
                return failure("Every stage needs the advancing module name and its lit LED colors");
            Set<String> lit = new LinkedHashSet<>();
            for (String color : stage.litLeds()) {
                String normalized = normalizeColor(color);
                if (!COLORS.contains(normalized)) return failure("Unknown LED color in stage " + (stageIndex + 1) + ": " + color);
                lit.add(normalized);
            }
            String moduleName = stage.moduleName().toLowerCase(Locale.ROOT);
            for (int color = 0; color < COLORS.size(); color++) {
                boolean on = lit.contains(COLORS.get(color));
                if (BROKEN_WORDS.get(color).stream().anyMatch(moduleName::contains)) on = !on;
                if (on) totals[color]++;
            }
        }
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");
        int portTypes = (int) bomb.getPortPlates().stream().flatMap(plate -> plate.getPorts().stream()).distinct().count();
        int duplicatePortTypes = (int) bomb.getPortPlates().stream().flatMap(plate -> plate.getPorts().stream())
            .collect(java.util.stream.Collectors.groupingBy(port -> port, java.util.stream.Collectors.counting())).values().stream().filter(count -> count > 1).count();
        int litIndicators = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int unlitIndicators = (int) bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
        int serialDigitTotal = serial.chars().filter(Character::isDigit).map(character -> character - '0').sum();
        int serialLetters = (int) serial.chars().filter(Character::isLetter).count();
        int[] multipliers = {bomb.getAaBatteryCount(),bomb.getPortPlates().size(),input.startingBombMinutes(),duplicatePortTypes,
            bomb.getModules().size(),bomb.getStrikes(),serialDigitTotal,serialLetters,portTypes,litIndicators,totals[10],unlitIndicators,bomb.getDBatteryCount()};
        int value = 0;
        for (int color = 0; color < COLORS.size(); color++) value += totals[color] * multipliers[color];
        int keyStage = Math.floorMod(value - 1, input.stages().size()) + 1;
        String keyModule = input.stages().get(keyStage - 1).moduleName().trim();

        List<String> available = new ArrayList<>(COLORS);
        if (input.alreadyCutColors() != null) for (String color : input.alreadyCutColors()) available.remove(normalizeColor(color));
        List<String> cuts = new ArrayList<>();
        for (char character : keyModule.toUpperCase(Locale.ROOT).toCharArray()) {
            int color = charColor(character);
            if (color >= 0 && available.remove(COLORS.get(color))) cuts.add(COLORS.get(color));
        }
        if (cuts.isEmpty() && !available.isEmpty()) cuts.add(available.get(0));
        return success(new ForgetThemAllOutput(value, keyStage, keyModule, List.copyOf(cuts), cuts.isEmpty() ? "" : "cut " + String.join(" ", cuts)));
    }

    private static int charColor(char character) {
        if (character >= '0' && character <= '9') return character - '0';
        if (character < 'A' || character > 'Z') return -1;
        int index = character - 'A';
        return index < 13 ? index : index - 13;
    }

    private static String normalizeColor(String color) {
        if (color == null) return "";
        String normalized = color.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("gray") ? "grey" : normalized;
    }
}
