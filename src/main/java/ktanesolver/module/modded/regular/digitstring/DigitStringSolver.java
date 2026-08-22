package ktanesolver.module.modded.regular.digitstring;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
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
    type = ModuleType.DIGIT_STRING, id = "digitString", name = "Digit String",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Replace the first serial-rule digit sequence with its operator and evaluate the resulting expression.",
    tags = {"digits", "serial number", "operators", "arithmetic"}
)
public class DigitStringSolver extends AbstractModuleSolver<DigitStringInput, DigitStringOutput> {
    @Override
    protected SolveResult<DigitStringOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, DigitStringInput input) {
        String shown = input == null ? null : input.displayedNumber();
        if (shown == null || !shown.trim().matches("[1-9][0-9]{6}[1-9]")) return failure("Enter the eight-digit display (its first and last digits are nonzero)");
        shown = shown.trim();
        String serial = bomb.getSerialNumber();
        if (serial == null || !serial.matches("[A-Za-z0-9]{6}")) return failure("Enter the six-character bomb serial number first");
        serial = serial.toUpperCase(Locale.ROOT);
        int[] digits = shown.chars().map(c -> c - '0').toArray();

        for (int serialIndex = 0; serialIndex < 6; serialIndex++) {
            char character = serial.charAt(serialIndex);
            char rule = serial.indexOf(character) != serial.lastIndexOf(character) ? '#' : character;
            int length = length(rule);
            for (int start = 1; start + length < 8; start++) {
                if (matches(rule, digits, start, serial, serialIndex + 1)) {
                    return success(result(shown, start, length, serialIndex, rule == '#' ? "Repeat" : String.valueOf(rule), module));
                }
            }
        }

        int unique = (int) serial.chars().distinct().count();
        return success(result(shown, unique, 1, 2, "fallback", module));
    }

    private static DigitStringOutput result(String shown, int start, int removed, int serialIndex, String rule, ModuleEntity module) {
        long first = Long.parseLong(shown.substring(0, start));
        long second = Long.parseLong(shown.substring(start + removed));
        char operator = serialIndex == 0 || serialIndex == 4 ? '×' : serialIndex == 1 ? '>' : serialIndex == 3 ? '<' : '+';
        long answer = switch (operator) { case '×' -> first * second; case '>' -> first > second ? 1 : 0; case '<' -> first < second ? 1 : 0; default -> first + second; };
        module.getState().put("digitStringInitialNumber", shown);
        return new DigitStringOutput(answer, first + " " + operator + " " + second, serialIndex + 1, rule);
    }

    private static int length(char rule) {
        if ("05AOY".indexOf(rule) >= 0) return 5;
        if ("DFLMSTW".indexOf(rule) >= 0) return 4;
        if ("0268BCEIJQUVXZ".indexOf(rule) >= 0) return 3;
        return 2;
    }

    private static boolean matches(char rule, int[] all, int start, String serial, int serialPosition) {
        int length = length(rule), value = 0;
        int[] d = Arrays.copyOfRange(all, start, start + length);
        for (int digit : d) value = value * 10 + digit;
        return switch (rule) {
            case '0' -> value % 100 == 0;
            case '1' -> value % 13 == 0;
            case '2' -> Arrays.stream(d).allMatch(n -> n % 2 == 0);
            case '3' -> value == 33 || value == 66 || value == 99;
            case '4' -> Set.of(65, 16, 47, 73, 90).contains(value);
            case '5' -> distinct(d, 0, 4) == 4 && d[4] == d[0];
            case '6' -> sum(d) == 6;
            case '7' -> Math.abs(d[0] - d[1]) == 7;
            case '8' -> Arrays.stream(d).allMatch(n -> n == 2 || n == 4 || n == 8);
            case '9' -> sum(d) == 9;
            case 'A' -> Arrays.stream(d).noneMatch(n -> n == 0) && distinct(d, 0, 5) == 5;
            case 'B' -> d[0] == 1 && d[2] == 2;
            case 'C' -> Arrays.stream(d).allMatch(n -> n >= 7);
            case 'D' -> increasing(d);
            case 'E' -> sum(d) == 13;
            case 'F' -> Arrays.stream(d).allMatch(n -> n % 2 == 1);
            case 'G' -> d[1] >= d[0] + 3;
            case 'H' -> (d[0] == 7 || d[0] == 9) && d[1] % 2 == 0;
            case 'I' -> Arrays.stream(d).filter(n -> n == 1 || n == 7).count() == 2;
            case 'J' -> Arrays.stream(d).allMatch(n -> n == 2 || n == 3 || n == 5 || n == 9) && distinct(d, 0, 3) == 3;
            case 'K' -> value % 15 == 0;
            case 'L' -> sum(d) == 14;
            case 'M' -> value >= 5930 && value <= 6075;
            case 'N' -> d[0] == d[1];
            case 'O' -> Arrays.stream(d).allMatch(n -> n % 2 == 0 || n == 7);
            case 'P' -> (d[0] == 2 || d[0] == 4) && d[1] % 2 == 1;
            case 'Q' -> sum(d) >= 23;
            case 'R' -> serial.indexOf((char) ('0' + d[0])) >= 0 && serial.indexOf((char) ('0' + d[1])) >= 0;
            case 'S' -> decreasing(d);
            case 'T' -> sum(d) > 28 || sum(d) < 8;
            case 'U' -> d[0] == d[2];
            case 'V' -> Arrays.stream(d).allMatch(n -> n <= 2);
            case 'W' -> Arrays.stream(d).allMatch(n -> n % 2 == 0);
            case 'X' -> value >= 395 && value <= 411;
            case 'Y' -> Arrays.stream(d).noneMatch(n -> n == 3 || n == 6);
            case 'Z' -> Arrays.stream(d).filter(n -> n == 2 || n == 5).count() >= 2;
            case '#' -> value == serialPosition * 12 || value == serialPosition * 15;
            default -> false;
        };
    }

    private static int sum(int[] values) { return Arrays.stream(values).sum(); }
    private static int distinct(int[] values, int from, int to) { Set<Integer> set = new HashSet<>(); for (int i = from; i < to; i++) set.add(values[i]); return set.size(); }
    private static boolean increasing(int[] values) { for (int i = 1; i < values.length; i++) if (values[i - 1] >= values[i]) return false; return true; }
    private static boolean decreasing(int[] values) { for (int i = 1; i < values.length; i++) if (values[i - 1] <= values[i]) return false; return true; }
}
