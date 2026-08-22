package ktanesolver.module.modded.regular.brushstrokes;

import java.util.Arrays;
import java.util.EnumMap;
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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.brushstrokes.BrushStrokesInput.KeyColor;

@Service
@ModuleInfo(type = ModuleType.BRUSH_STROKES, id = "brushStrokes", name = "Brush Strokes",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Calculate the color-specific key number and draw its symbol on the nine-point grid.",
    tags = {"drawing", "colors", "edgework", "symbols", "grid"})
public class BrushStrokesSolver extends AbstractModuleSolver<BrushStrokesInput, BrushStrokesOutput> {
    private static final Map<KeyColor, String> MANUALS = manuals();
    private static final String[] PATTERNS = {
        "12 23 78 25 36 47 58 69 15 59", "12 23 89 14 25 36 47 58 69",
        "12 23 78 14 25 36 47 58 69", "12 23 45 78 25 36 47 58 69",
        "12 23 45 56 78 89 36 47", "12 23 78 89 25 36 58 69",
        "12 23 78 89 14 25 36 47 58 69", "12 23 45 56 78 89 14 47",
        "12 23 45 56 78 36 47 69", "12 23 45 56 14 47 68",
        "12 23 78 89 15 59 35 57", "12 23 78 89 15 59",
        "12 23 78 89 36 15 59", "23 45 56 14 47 69 24",
        "12 23 45 56 78 89 14 36 47 69", "12 23 45 56 78 89 14 69",
        "12 23 45 56 78 36 47 58 69", "78 89 14 36 47 69",
        "23 78 89 14 25 36 47 58 69", "12 23 78 89 14 36 47 69",
        "12 78 89 14 25 36 47 58 69", "12 23 45 56 78 89 36 69",
        "12 56 78 14 25 36 47 58 69", "78 89 14 25 36 47 58 69",
        "12 23 45 56 25 47 69", "12 89 14 25 36 47 58 69",
        "23 45 89 14 25 36 47 58 69", "12 23 56 89 14 36 47 58",
        "14 36 47 69 15 59", "12 23 56 78 14 47 58 69",
        "12 23 45 78 25 36 47 69", "23 78 89 14 25 36 47 69",
        "23 78 89 25 36 69", "25 58", "14 36 47 69"
    };

    @Override
    protected SolveResult<BrushStrokesOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BrushStrokesInput input) {
        if (input == null || input.keyColor() == null) return failure("Choose the center point color");
        if (bomb == null || bomb.getSerialNumber() == null || bomb.getSerialNumber().isBlank()) return failure("Bomb serial number is required");
        if (input.keyColor() == KeyColor.CYAN && bomb.isLastDigitEven() && (input.solvableModuleCount() == null || input.solvableModuleCount() < 1))
            return failure("Enter the total number of solvable modules for an even-last-digit cyan key");
        int raw = keyNumber(bomb, input.keyColor(), input.solvableModuleCount());
        int symbol = Math.abs(raw) % 35 + 1;
        List<String> strokes = List.of(PATTERNS[symbol - 1].split(" "));
        String twitch = "connect " + strokes.stream().map(s -> s.charAt(0) + " " + s.charAt(1)).reduce((a, b) -> a + ";" + b).orElse("");
        return success(new BrushStrokesOutput(MANUALS.get(input.keyColor()), raw, symbol, strokes, twitch));
    }

    static int keyNumber(BombEntity bomb, KeyColor color, Integer solvableModuleCount) {
        String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
        int[] digits = serial.chars().filter(Character::isDigit).map(c -> c - '0').toArray();
        int batteries = bomb.getBatteryCount(), indicatorCount = bomb.getIndicators().size();
        int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int ports = bomb.getPortPlates().stream().mapToInt(p -> p.getPorts().size()).sum();
        return switch (color) {
            case RED -> {
                int n = alpha(firstLetter(serial)) + digits[digits.length - 1] * batteries;
                yield bomb.hasPort(PortType.STEREO_RCA) && !bomb.hasPort(PortType.RJ45) ? n * 2 % 100 : n % 100;
            }
            case ORANGE -> base16ish(serial.charAt(0)) * 16 + base16ish(serial.charAt(1));
            case YELLOW -> Arrays.stream(digits).sum() + bomb.getStrikes();
            case LIME -> burglarAlarm(bomb, serial, batteries, lit, indicatorCount);
            case GREEN -> serial.chars().filter(Character::isLetter).map(BrushStrokesSolver::alpha).sum() + lit;
            case CYAN -> digits[digits.length - 1] % 2 == 0 ? solvableModuleCount % 11 + 1 : (batteries + indicatorCount) % 5 + 1;
            case SKY -> distinctPorts(bomb) * 7 + matchingIndicators(bomb, serial, true) * 5 + matchingIndicators(bomb, serial, false);
            case BLUE -> theCode(bomb, serial, digits, batteries, lit, indicatorCount, ports);
            case PURPLE -> Character.isDigit(serial.charAt(0)) ? serial.charAt(0) - '0' : alpha(serial.charAt(0)) + 5;
            case MAGENTA -> (int) serial.chars().filter(c -> "RADI4T07".indexOf(c) >= 0).count() * 10 + 5 * (bomb.getAaBatteryCount() / 2) - 5 * bomb.getDBatteryCount();
            case BROWN -> cooking(bomb, batteries, indicatorCount, ports);
            case WHITE -> ports + (int) serial.chars().filter(Character::isLetter).count();
            case GRAY -> fastMath(bomb, serial, batteries);
            case BLACK -> x01(bomb, digits.length, indicatorCount, ports);
            case PINK -> moduleHomework(bomb, serial, digits);
        };
    }

    private static int burglarAlarm(BombEntity bomb, String serial, int batteries, int lit, int indicators) {
        int n = batteries > 4 ? (indicators - lit == 0 ? 20 : 60) : (lit == 0 ? 40 : 90);
        if (batteries == indicators) return containsAny(serial, "BURG14R") ? n + 1 : n;
        return containsAny(serial, "AL53M") ? n : n + 8;
    }
    private static int theCode(BombEntity bomb, String serial, int[] digits, int batteries, int lit, int indicators, int ports) {
        if (digits[0] == digits[digits.length - 1] && batteries == 0) return 1;
        if (bomb.hasIndicator("CLR")) return 8;
        if (containsAny(serial, "XYZ")) return 20;
        if (ports >= 5) return 30;
        if (batteries == 0) return 42;
        return lit > indicators - lit ? 69 : 3;
    }
    private static int cooking(BombEntity bomb, int batteries, int indicators, int ports) {
        int meal = Math.floorMod(bomb.getBatteryHolders() - indicators + batteries * ports - bomb.getPortPlates().size() - 1, 5);
        return new int[]{250, 160, 200, 180, 180}[meal];
    }
    private static int fastMath(BombEntity bomb, String serial, int batteries) {
        int n = bomb.isIndicatorLit("MSA") ? 20 : 0;
        if (bomb.hasPort(PortType.SERIAL)) n += 14;
        if (containsAny(serial, "FAST")) n -= 5;
        if (bomb.hasPort(PortType.RJ45)) n += 27;
        if (batteries > 3) n -= 15;
        return n;
    }
    private static int x01(BombEntity bomb, int serialDigits, int indicators, int ports) {
        int first = bomb.getAaBatteryCount() + serialDigits;
        int row = first < 3 ? 0 : first < 5 ? 1 : first < 6 ? 2 : first < 8 ? 3 : 4;
        int second = indicators + ports, column = second < 3 ? 0 : second < 6 ? 1 : 2;
        return new int[][]{{74,53,79},{62,41,70},{42,47,86},{38,66,51},{80,67,58}}[row][column];
    }
    private static int moduleHomework(BombEntity bomb, String serial, int[] digits) {
        int n = digits[0];
        if (containsAny(serial, "SCHOOL")) n += 3;
        if (bomb.getIndicators().keySet().stream().anyMatch(i -> containsAny(i, "STUDENT"))) n += 2;
        if (bomb.hasPort(PortType.PARALLEL)) n += 2;
        if (bomb.hasIndicator("FRK") || bomb.hasIndicator("NSA")) n += 2;
        if (containsAny(serial, "AEIOU")) n += 5;
        if (bomb.getDBatteryCount() > 1) n += 2;
        return bomb.isIndicatorLit("BOB") ? 1 : n;
    }
    private static int matchingIndicators(BombEntity bomb, String serial, boolean lit) {
        return (int) bomb.getIndicators().entrySet().stream().filter(e -> Boolean.valueOf(lit).equals(e.getValue()))
            .filter(e -> e.getKey().chars().anyMatch(c -> serial.indexOf(c) >= 0)).count();
    }
    private static int distinctPorts(BombEntity bomb) { return (int) bomb.getPortPlates().stream().flatMap(p -> p.getPorts().stream()).distinct().count(); }
    private static int base16ish(char c) { return Character.isDigit(c) ? c - '0' : alpha(c) % 16; }
    private static char firstLetter(String value) { return (char) value.chars().filter(Character::isLetter).findFirst().orElseThrow(); }
    private static int alpha(int c) { return c - 'A' + 1; }
    private static boolean containsAny(String value, String characters) { return value.chars().anyMatch(c -> characters.indexOf(c) >= 0); }
    private static Map<KeyColor, String> manuals() {
        Map<KeyColor, String> m = new EnumMap<>(KeyColor.class);
        String[] names = {"Two Bits", "Color Generator", "Modern Cipher", "Burglar Alarm", "Catchphrase", "Regular Hexpressions", "Safety Safe", "The Code", "Tennis", "Radiator", "Cooking", "Character Shift", "Fast Math", "X01", "Module Homework"};
        KeyColor[] colors = KeyColor.values(); for (int i = 0; i < colors.length; i++) m.put(colors[i], names[i]); return Map.copyOf(m);
    }
}
