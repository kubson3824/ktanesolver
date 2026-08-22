package ktanesolver.module.modded.regular.micromodules;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
import ktanesolver.module.modded.regular.micromodules.MicroModulesInput.MicroIndicator;

@Service
@ModuleInfo(
    type = ModuleType.MICRO_MODULES,
    id = "KritMicroModules",
    name = "Micro-Modules",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Solve Script Wires, Directional Keypads, Code Morse, and The Math Code in the required order.",
    tags = {"edgework", "wires", "keypad", "morse", "math"}
)
public class MicroModulesSolver extends AbstractModuleSolver<MicroModulesInput, MicroModulesOutput> {
    private static final Set<String> PRIMARY = Set.of("RED", "GREEN", "BLUE");
    private static final Set<String> BATTERY_COLORS = Set.of("RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "PINK", "BLACK");
    private static final Set<String> RENDERERS = Set.of("BOMB", "EXPL", "MINI", "NULL", "BOB", "MSA", "SIG", "TRN", "DVID", "PARALLEL", "STEREORCA", "RJ45", "WIRECOUNT", "ALLWIRES", "WIRERENDERER", "CURRENTWIRE");
    private static final Set<String> COLORS = Set.of("RED", "YELLOW", "GREEN", "BLUE", "WHITE", "BLACK");
    private static final Set<String> ARROWS = Set.of("LEFT", "RIGHT", "REVERSE", "CLOCKWISE", "SWAP", "DIAGONAL_TL", "DIAGONAL_TR", "DIAGONAL_BL", "DIAGONAL_BR");
    private static final Set<String> OPERATORS = Set.of("+", "-", "*", "/");

    @Override
    protected SolveResult<MicroModulesOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, MicroModulesInput input
    ) {
        if (input == null) return failure("Enter the Micro-Modules observations");
        if (input.directionalKeypadsId() == null || input.codeMorseId() == null || input.scriptWiresId() == null || input.mathCodeId() == null) {
            return failure("Assign the unique module IDs 1 through 4");
        }
        List<Integer> ids = List.of(input.directionalKeypadsId(), input.codeMorseId(), input.scriptWiresId(), input.mathCodeId());
        if (!new HashSet<>(ids).equals(Set.of(1, 2, 3, 4))) return failure("Assign the unique module IDs 1 through 4");
        String microSerial = upper(input.microSerial()), batteryColor = upper(input.microBatteryColor());
        if (!microSerial.matches("[A-Z0-9]{5}[0-9]")) return failure("The micro-bomb serial must have six characters and end in a digit");
        if (!BATTERY_COLORS.contains(batteryColor)) return failure("Choose a valid micro-battery color");
        if (input.microIndicators() == null || input.microIndicators().size() != 3 || input.microIndicators().stream().anyMatch(value -> value == null || upper(value.label()).isBlank())) {
            return failure("Enter all three micro-indicators");
        }
        List<String> arrows = normalized(input.arrows()), wireColors = normalized(input.wireColors());
        if (arrows.size() != 4 || !ARROWS.containsAll(arrows)) return failure("Choose all four directional arrows");
        String renderer = upper(input.rendererName()).replace(" ", "");
        if (!RENDERERS.contains(renderer)) return failure("Enter the MeshRenderer name shown by Script Wires");
        if (wireColors.size() != 6 || !COLORS.containsAll(wireColors)) return failure("Choose all six wire colors");
        String morseDigits = input.receivedMorseDigits() == null ? "" : input.receivedMorseDigits().replaceAll("\\s", "");
        if (!morseDigits.matches("[0-9]{4}")) return failure("Decode the four received Morse digits");
        String letters = upper(input.mathLetters());
        String op1 = input.firstOperator(), op2 = input.secondOperator();
        if (!letters.matches("[A-Z]{3}") || !OPERATORS.contains(op1) || !OPERATORS.contains(op2)) return failure("Enter the three Math Code letters and both operators");

        long litIndicators = bomb.getIndicators() == null ? 0 : bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int batteries = bomb.getAaBatteryCount() + bomb.getDBatteryCount();
        Set<String> microLabels = input.microIndicators().stream().map(MicroIndicator::label).map(MicroModulesSolver::upper).collect(java.util.stream.Collectors.toSet());
        boolean specialOrder = (input.codeMorseId() == 1 && moduleNameCount(bomb, "MORSE") > 0)
            || (input.directionalKeypadsId() == 2 && moduleNameCount(bomb, "BUTTON") > 1)
            || (input.mathCodeId() == 3 && (microLabels.contains("MINI") || microLabels.contains("BOMB")))
            || (input.scriptWiresId() == 4 && PRIMARY.contains(batteryColor));
        boolean anyOrder = !specialOrder && anyOrder(bomb, input.microIndicators());
        List<String> solveOrder = solveOrder(bomb, input, microLabels, batteryColor, anyOrder);
        List<Integer> cutWires = cutWires(renderer, wireColors);
        int keypadPosition = keypadPosition(bomb, input, microSerial, microLabels, batteryColor, arrows, (int) litIndicators);
        String morseCode = morseCode(bomb, input.codeMorseId(), morseDigits, batteryColor, batteries);
        String mathCode = mathCode(letters, op1, op2, batteryColor, batteries, (int) litIndicators);

        Map<String, String> actions = new HashMap<>();
        actions.put("SCRIPT_WIRES", "cut " + cutWires.stream().map(String::valueOf).reduce((a, b) -> a + " " + b).orElse("6"));
        actions.put("DIRECTIONAL_KEYPADS", "press " + keypadPosition);
        actions.put("CODE_MORSE", "send " + String.join(" ", morseCode.chars().mapToObj(c -> Character.toString((char) c)).toList()));
        actions.put("THE_MATH_CODE", "answer " + String.join(" ", mathCode.chars().mapToObj(c -> Character.toString((char) c)).toList()));
        List<String> twitch = new ArrayList<>(solveOrder.stream().map(actions::get).toList());
        twitch.add("submit");
        return success(new MicroModulesOutput(solveOrder, anyOrder, cutWires, keypadPosition, morseCode, mathCode, List.copyOf(twitch)));
    }

    private static List<String> solveOrder(BombEntity bomb, MicroModulesInput input, Set<String> labels, String batteryColor, boolean anyOrder) {
        Map<Integer, String> byId = Map.of(input.directionalKeypadsId(), "DIRECTIONAL_KEYPADS", input.codeMorseId(), "CODE_MORSE", input.scriptWiresId(), "SCRIPT_WIRES", input.mathCodeId(), "THE_MATH_CODE");
        int start;
        if (input.codeMorseId() == 1 && moduleNameCount(bomb, "MORSE") > 0) start = 1;
        else if (input.directionalKeypadsId() == 2 && moduleNameCount(bomb, "BUTTON") > 1) start = 2;
        else if (input.mathCodeId() == 3 && (labels.contains("MINI") || labels.contains("BOMB"))) start = 3;
        else if (input.scriptWiresId() == 4 && PRIMARY.contains(batteryColor)) start = 4;
        else if (anyOrder) start = 1;
        else start = 1;
        List<String> result = new ArrayList<>(4);
        for (int offset = 0; offset < 4; offset++) result.add(byId.get((start + offset - 1) % 4 + 1));
        return List.copyOf(result);
    }

    private static boolean anyOrder(BombEntity bomb, List<MicroIndicator> indicators) {
        boolean regularBob = bomb.getIndicators() != null && Boolean.TRUE.equals(bomb.getIndicators().get("BOB"));
        return regularBob || indicators.stream().anyMatch(value -> upper(value.label()).equals("BOMB") && value.lit());
    }

    private static long moduleNameCount(BombEntity bomb, String fragment) {
        if (bomb.getModules() == null) return 0;
        return bomb.getModules().stream().map(ModuleEntity::getType).filter(java.util.Objects::nonNull)
            .map(Enum::name).filter(name -> name.contains(fragment)).count();
    }

    static List<Integer> cutWires(String renderer, List<String> colors) {
        List<String> targets;
        if (Set.of("BOMB", "EXPL", "MINI", "NULL").contains(renderer)) targets = List.of("RED", "YELLOW", "GREEN", "BLUE", "WHITE", "BLACK");
        else if (Set.of("BOB", "MSA", "SIG", "TRN").contains(renderer)) targets = List.of("BLACK", "WHITE", "BLUE", "GREEN", "YELLOW", "RED");
        else if (Set.of("DVID", "PARALLEL", "STEREORCA", "RJ45").contains(renderer)) targets = List.of("GREEN", "BLUE", "WHITE", "BLACK", "RED", "YELLOW");
        else targets = List.of("WHITE", "GREEN", "RED", "BLACK", "BLUE", "YELLOW");
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < 6; i++) if (colors.get(i).equals(targets.get(i))) result.add(i + 1);
        return result.isEmpty() ? List.of(6) : List.copyOf(result);
    }

    static int keypadPosition(BombEntity bomb, MicroModulesInput input, String microSerial, Set<String> labels, String batteryColor, List<String> arrows, int litIndicators) {
        int position = ((Character.digit(microSerial.charAt(5), 10) + input.directionalKeypadsId()) * Math.max(1, litIndicators) - 1) % 4;
        boolean allMicroLit = input.microIndicators().stream().allMatch(MicroIndicator::lit);
        boolean bothSerialsHaveVowels = hasVowel(microSerial) && hasVowel(bomb.getSerialNumber());
        for (int followed = 0; followed < 4; followed++) {
            String arrow = arrows.get(position);
            boolean fake = (arrow.equals("LEFT") && allMicroLit)
                || (arrow.equals("RIGHT") && labels.contains("INDC"))
                || (arrow.equals("REVERSE") && bothSerialsHaveVowels)
                || (arrow.equals("CLOCKWISE") && batteryColor.equals("RED"))
                || (arrow.equals("SWAP") && input.directionalKeypadsId() == 4)
                || (arrow.startsWith("DIAGONAL_") && bomb.getDBatteryCount() > 2);
            if (fake) break;
            position = switch (arrow) {
                case "LEFT", "RIGHT" -> position ^ 1;
                case "REVERSE" -> position ^ 2;
                case "CLOCKWISE" -> switch (position) { case 0 -> 1; case 1 -> 3; case 3 -> 2; default -> 0; };
                case "SWAP" -> position ^ 3;
                case "DIAGONAL_TL" -> 0; case "DIAGONAL_TR" -> 1; case "DIAGONAL_BL" -> 2; default -> 3;
            };
        }
        return position + 1;
    }

    static String morseCode(BombEntity bomb, int moduleId, String received, String batteryColor, int batteries) {
        int value = Integer.parseInt(received) + batteries * 10;
        if (PRIMARY.contains(batteryColor)) value *= 30;
        String serial = bomb.getSerialNumber();
        int lastDigit = serial == null || serial.isEmpty() ? 0 : Character.digit(serial.charAt(serial.length() - 1), 10);
        value = lastDigit == 0 ? value * 5 : value / lastDigit;
        if (Math.abs(value % 10) % 2 == 1) value += 101;
        value *= moduleId;
        while (value > 9999) value -= 1000;
        return Integer.toString(value);
    }

    static String mathCode(String letters, String op1, String op2, String batteryColor, int batteries, int litIndicators) {
        int a = letters.charAt(0) - 'A' + 1, b = letters.charAt(1) - 'A' + 1, c = letters.charAt(2) - 'A' + 1;
        if (PRIMARY.contains(batteryColor)) a += 5;
        b = hasVowel(letters) ? b * 3 : b - 3;
        if (a == 0) a = 1; if (b == 0) b = 1; if (c == 0) c = 1;
        c += batteries;
        int multiplier = Math.max(1, litIndicators);
        a *= multiplier; b *= multiplier; c *= multiplier;
        int value = precedence(op2) > precedence(op1) ? apply(a, op1, apply(b, op2, c)) : apply(apply(a, op1, b), op2, c);
        while (value < 100) value += 100;
        while (value > 999) value -= 100;
        return String.format(Locale.ROOT, "%03d", value);
    }

    private static int apply(int left, String operator, int right) {
        return switch (operator) { case "+" -> left + right; case "-" -> left - right; case "*" -> left * right; default -> left / right; };
    }

    private static int precedence(String operator) { return operator.equals("*") || operator.equals("/") ? 2 : 1; }
    private static boolean hasVowel(String value) { return value != null && upper(value).chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0); }
    private static String upper(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
    private static List<String> normalized(List<String> values) { return values == null ? List.of() : values.stream().map(MicroModulesSolver::upper).toList(); }
}
