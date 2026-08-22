package ktanesolver.module.modded.regular.simonstores;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import ktanesolver.module.modded.regular.simonstores.SimonStoresInput.Color;

@Service
@ModuleInfo(
        type = ModuleType.SIMON_STORES,
        id = "simonStores",
        name = "Simon Stores",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Evaluate the growing flash sequence and submit each balanced-ternary stage.",
        tags = {"simon", "colors", "memory", "stages", "balanced ternary"})
public class SimonStoresSolver extends AbstractModuleSolver<SimonStoresInput, SimonStoresOutput> {
    private static final String COLORS = "RGBCMY";
    private static final Set<Character> PRIMARY = Set.of('R', 'G', 'B');

    @Override
    protected SolveResult<SimonStoresOutput> doSolve(
            RoundEntity round, BombEntity bomb, ModuleEntity module, SimonStoresInput input) {
        if (input == null || input.stage() < 1 || input.stage() > 3
                || input.buttonOrder() == null || input.buttonOrder().size() != 6
                || input.buttonOrder().stream().anyMatch(Objects::isNull)
                || new HashSet<>(input.buttonOrder()).size() != 6
                || input.flashes() == null || input.flashes().size() != input.stage() + 2) {
            return failure("Enter the stage, all six clockwise button colors, and exactly 3, 4, or 5 cumulative flashes");
        }
        List<String> flashes = new ArrayList<>();
        for (String flash : input.flashes()) {
            String normalized = normalizeFlash(flash);
            if (normalized == null) return failure("Each flash must contain 1–3 different colors from R, G, B, C, M, Y");
            flashes.add(normalized);
        }
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.length() != 6 || serial.chars().anyMatch(ch -> Character.digit(ch, 36) < 0)) {
            return failure("A six-character base-36 serial number is required");
        }

        Map<String, Object> state = module.getState();
        int completed = state.get("simonStoresCompletedStage") instanceof Number number ? number.intValue() : 0;
        if (input.stage() != completed + 1) return failure("Enter stage " + (completed + 1) + " next");
        List<String> buttonCodes = input.buttonOrder().stream().map(Enum::name).toList();
        if (state.containsKey("simonStoresButtonOrder") && !Objects.equals(state.get("simonStoresButtonOrder"), buttonCodes)) {
            return failure("The clockwise button order must remain unchanged between stages");
        }
        List<String> previousFlashes = strings(state.get("simonStoresFlashes"));
        if (previousFlashes == null || flashes.size() < previousFlashes.size()
                || !flashes.subList(0, previousFlashes.size()).equals(previousFlashes)) {
            return failure("The flash sequence must retain every previously entered flash");
        }

        int[] serialDigits = serial.chars().map(ch -> Character.digit(ch, 36)).toArray();
        int d = java.util.Arrays.stream(serialDigits).sum();
        int[][] steps = new int[3][6];
        steps[0][0] = norm(serialDigits[2] * 36 + serialDigits[3]);
        steps[1][0] = norm(serialDigits[4] * 36 + serialDigits[5]);
        steps[2][0] = norm(serialDigits[0] * 36 + serialDigits[1]);
        for (int stage = 0; stage < input.stage(); stage++) {
            for (int n = 1; n <= stage + 3; n++) {
                steps[stage][n] = applyFlash(flashes.get(n - 1), stage, n, steps, d);
            }
        }

        List<Character> execution = executionOrder(input.stage() - 1, buttonCodes);
        int result = steps[input.stage() - 1][input.stage() + 2];
        String trits = balancedTernary(result);
        List<String> presses = new ArrayList<>();
        StringBuilder twitch = new StringBuilder("A");
        boolean negative = false;
        for (int power = 0; power < 6; power++) {
            char trit = trits.charAt(5 - power);
            if (trit == '0') continue;
            if (trit == '-' && !negative) { twitch.append('K'); negative = true; }
            if (trit == '+' && negative) { twitch.append('W'); negative = false; }
            char color = execution.get(power);
            presses.add("" + trit + color);
            twitch.append(color);
        }
        twitch.append('A');

        storeState(module, "simonStoresButtonOrder", buttonCodes);
        storeState(module, "simonStoresFlashes", List.copyOf(flashes));
        storeState(module, "simonStoresCompletedStage", input.stage());
        List<Integer> stageValues = new ArrayList<>();
        for (int n = 0; n <= input.stage() + 2; n++) stageValues.add(steps[input.stage() - 1][n]);
        return success(new SimonStoresOutput(
                input.stage(), stageValues, result, trits,
                execution.stream().map(String::valueOf).reduce("", String::concat),
                presses, twitch.toString()), input.stage() == 3);
    }

    private static int applyFlash(String flash, int stage, int n, int[][] step, int d) {
        int current = step[stage][n - 1];
        int a = step[0][n - 1], b = step[1][n - 1], c = step[2][n - 1];
        List<Character> primaries = flash.chars().mapToObj(ch -> (char) ch).filter(PRIMARY::contains).toList();
        List<Character> secondaries = flash.chars().mapToObj(ch -> (char) ch).filter(ch -> !PRIMARY.contains(ch)).toList();
        if (flash.length() == 1) return color(flash.charAt(0), current, stage, n, step, d);
        if (flash.length() == 2) {
            if (primaries.size() == 2) {
                if (stage == 0) return norm(Math.max(color(primaries.get(0), current, stage, n, step, d), color(primaries.get(1), current, stage, n, step, d)));
                if (stage == 1) return norm(Math.abs(color(primaries.get(0), current, stage, n, step, d) - color(primaries.get(1), current, stage, n, step, d)));
                char missing = "RGB".chars().mapToObj(ch -> (char) ch).filter(ch -> !primaries.contains(ch)).findFirst().orElseThrow();
                return norm(color(missing, c, stage, n, step, d) + color(missing, b, stage, n, step, d) + color(missing, a, stage, n, step, d));
            }
            if (secondaries.size() == 2) {
                if (stage == 0) return norm(Math.min(color(secondaries.get(0), current, stage, n, step, d), color(secondaries.get(1), current, stage, n, step, d)));
                char missing = "CMY".chars().mapToObj(ch -> (char) ch).filter(ch -> !secondaries.contains(ch)).findFirst().orElseThrow();
                if (stage == 1) return norm(Math.max(color(missing, b, stage, n, step, d), color(missing, a, stage, n, step, d)));
                return norm(color(missing, c, stage, n, step, d) - color(secondaries.get(0), c, stage, n, step, d) - color(secondaries.get(1), c, stage, n, step, d));
            }
            char p = primaries.get(0), s = secondaries.get(0);
            int px = color(p, current, stage, n, step, d), sx = color(s, current, stage, n, step, d);
            if (stage == 0) return norm(px + sx - 2 * d);
            if (stage == 1) return norm(4 * d - norm(Math.abs(px - sx)));
            return norm(Math.min(Math.min(px, sx), norm(-Math.abs(px - sx))));
        }
        if (primaries.size() == 3) {
            if (stage == 0) return norm(a + step[0][0]);
            if (stage == 1) return norm(b + (b % 4) * step[1][0] - step[0][3]);
            return norm(c + (c % 3) * step[2][0] - (b % 3) * step[1][0] + (a % 3) * step[0][0]);
        }
        if (secondaries.size() == 3) {
            if (stage == 0) return norm(a - step[0][0]);
            if (stage == 1) return norm(b + (step[1][0] % 4) * b - step[0][3]);
            return norm(c + (step[2][0] % 3) * c - (step[1][0] % 3) * b + (step[0][0] % 3) * a);
        }
        if (primaries.size() == 2) {
            char p1 = primaries.get(0), p2 = primaries.get(1), s = secondaries.get(0);
            if (stage == 0) return norm(Math.max(Math.max(color(p1, a, stage, n, step, d), color(p2, a, stage, n, step, d)), color(s, a, stage, n, step, d)));
            if (stage == 1) return norm(b + color(p1, b, stage, n, step, d) + color(p2, b, stage, n, step, d) - color(s, a, stage, n, step, d));
            return norm(color(p1, c, stage, n, step, d) + color(p2, c, stage, n, step, d) - color(s, b, stage, n, step, d) - color(s, a, stage, n, step, d));
        }
        char p = primaries.get(0), s1 = secondaries.get(0), s2 = secondaries.get(1);
        if (stage == 0) return norm(Math.min(Math.min(color(s1, a, stage, n, step, d), color(s2, a, stage, n, step, d)), color(p, a, stage, n, step, d)));
        if (stage == 1) return norm(b + color(s1, a, stage, n, step, d) + color(s2, a, stage, n, step, d) - color(p, b, stage, n, step, d));
        return norm(color(s1, c, stage, n, step, d) + color(s2, c, stage, n, step, d) - color(p, b, stage, n, step, d) - color(p, a, stage, n, step, d));
    }

    private static int color(char color, int x, int stage, int n, int[][] step, int d) {
        return norm(switch (color) {
            case 'R' -> stage == 0 ? x + d : stage == 1 ? x + step[0][n - 1] + n * n : x + step[1][n - 1] - step[0][n - 1];
            case 'G' -> stage == 0 ? x - d : stage == 1 ? 2 * x - step[0][n - 1] : x - 2 * step[1][n - 1];
            case 'B' -> stage == 0 ? 2 * x - d : stage == 1 ? 2 * x - step[0][0] - 4 * n * n : x + step[1][0] - step[0][3];
            case 'C' -> stage == 0 ? d - x - 8 * n : stage == 1 ? x + step[0][1] : x - step[1][n - 1] + step[0][n - 1];
            case 'M' -> stage == 0 ? 3 * n * n * n - 2 * x : stage == 1 ? x + step[0][2] - d : x - 2 * step[0][n - 1];
            case 'Y' -> stage == 0 ? x + d - 6 * n : stage == 1 ? x + step[0][3] - step[0][n - 1] : x + step[1][4] - step[0][0];
            default -> throw new IllegalArgumentException("Unknown color");
        });
    }

    private static List<Character> executionOrder(int stage, List<String> buttonOrder) {
        List<Character> order = new ArrayList<>((switch (stage) {
            case 0 -> "RGBCMY"; case 1 -> "YBGMCR"; default -> "BMRYGC";
        }).chars().mapToObj(ch -> (char) ch).toList());
        if (buttonOrder.indexOf("Y") == 0) Collections.rotate(order, 1);
        if (buttonOrder.indexOf("R") % 3 == buttonOrder.indexOf("C") % 3) replace(order, "RGBCMY", "CMYRBG");
        if (buttonOrder.indexOf("G") == 0 || buttonOrder.indexOf("G") == 5) replace(order, "RGB", "GBR");
        if (buttonOrder.indexOf("M") == 2 || buttonOrder.indexOf("M") == 3) replace(order, "CMY", "MYC");
        if ((buttonOrder.indexOf("B") < 3) == (buttonOrder.indexOf("Y") < 3)) Collections.swap(order, order.indexOf('B'), 5 - order.indexOf('B'));
        if (buttonOrder.indexOf("R") < 3) Collections.swap(order, order.indexOf('R'), order.indexOf('Y'));
        if (buttonOrder.indexOf("B") > 2) Collections.swap(order, order.indexOf('G'), order.indexOf('C'));
        return order;
    }

    private static void replace(List<Character> values, String from, String to) {
        for (int i = 0; i < values.size(); i++) {
            int index = from.indexOf(values.get(i));
            if (index >= 0) values.set(i, to.charAt(index));
        }
    }

    private static String balancedTernary(int value) {
        char[] trits = new char[6];
        for (int i = 6; i > 0; i--) {
            int power = (int) Math.pow(3, i - 1);
            if (Math.abs(value) < (power + 1) / 2) trits[6 - i] = '0';
            else if (value > 0) { trits[6 - i] = '+'; value -= power; }
            else { trits[6 - i] = '-'; value += power; }
        }
        return new String(trits);
    }

    private static String normalizeFlash(String flash) {
        if (flash == null) return null;
        String value = flash.toUpperCase().replaceAll("[^RGBCMY]", "");
        if (value.length() < 1 || value.length() > 3 || value.chars().distinct().count() != value.length()) return null;
        return COLORS.chars().filter(ch -> value.indexOf(ch) >= 0).collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString();
    }

    private static List<String> strings(Object value) {
        if (value == null) return List.of();
        if (!(value instanceof List<?> list) || list.stream().anyMatch(item -> !(item instanceof String))) return null;
        return list.stream().map(String.class::cast).toList();
    }

    private static int norm(int value) { return value % 365; }
}
