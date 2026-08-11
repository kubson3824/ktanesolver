package ktanesolver.module.modded.regular.tenbuttoncolorcode;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
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
    type = ModuleType.TEN_BUTTON_COLOR_CODE,
    id = "TenButtonColorCode",
    name = "Ten-Button Color Code",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Apply the ten color rules in the correct direction for both stages.",
    tags = {"colors", "buttons", "rules", "multi-stage"}
)
public class TenButtonColorCodeSolver extends AbstractModuleSolver<TenButtonColorCodeInput, TenButtonColorCodeOutput> {
    private static final List<String> COLORS = List.of("RED", "GREEN", "BLUE");

    @Override
    protected SolveResult<TenButtonColorCodeOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, TenButtonColorCodeInput input
    ) {
        if (input == null || input.stage() == null || input.colors() == null) {
            return failure("Enter the stage and all ten initial button colors");
        }
        if (input.stage() < 1 || input.stage() > 2) return failure("The stage must be 1 or 2");
        if (input.colors().size() != 10) return failure("Enter exactly ten button colors in reading order");

        int[] initial = new int[10];
        for (int i = 0; i < initial.length; i++) {
            String color = input.colors().get(i);
            if (color == null || !COLORS.contains(color.trim().toUpperCase(Locale.ROOT))) {
                return failure("Each button must be red, green, or blue");
            }
            initial[i] = COLORS.indexOf(color.trim().toUpperCase(Locale.ROOT));
        }

        List<List<String>> history = input.stage() == 1
            ? new ArrayList<>()
            : colorHistory(module.getState().get("tenButtonColorCodeInitialColors"));
        if (input.stage() == 2 && history.size() != 1) {
            return failure("Solve stage 1 before entering stage 2");
        }
        history.add(colorNames(initial).stream().map(name -> name.toLowerCase(Locale.ROOT)).toList());

        int startingRule = input.stage() == 1
            ? bomb.getLastDigit()
            : bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').sum() % 10;
        int[] target = initial.clone();
        for (int step = 0; step <= 10; step++) {
            int rule = input.stage() == 1 ? (startingRule + step) % 10 : (startingRule + 10 - step) % 10;
            applyRule(target, rule, startingRule, bomb.isLastDigitEven());
        }

        List<Integer> presses = new ArrayList<>();
        for (int button = 0; button < 10; button++) {
            int count = (target[button] - initial[button] + 3) % 3;
            for (int press = 0; press < count; press++) presses.add(button + 1);
        }
        storeState(module, "tenButtonColorCodeInitialColors", List.copyOf(history));
        return success(new TenButtonColorCodeOutput(input.stage(), colorNames(target), List.copyOf(presses)), input.stage() == 2);
    }

    private static void applyRule(int[] colors, int rule, int startingRule, boolean lastDigitEven) {
        int[] before = colors.clone();
        switch (rule) {
            case 0 -> {
                int excluded = startingRule == 0 ? 9 : startingRule - 1;
                for (int i = 0; i < 10; i++) if (i != excluded) advance(colors, i, 1);
            }
            case 1 -> {
                for (int row = 0; row < 2; row++) {
                    for (int i = row * 5; i < row * 5 + 4; i++) {
                        if (colors[i] == colors[i + 1]) {
                            colors[i + 1] = colors[i + 1] == 0 ? 1 : 0;
                            break;
                        }
                    }
                }
            }
            case 2 -> {
                for (int color = 0; color < 3; color++) {
                    int selectedColor = color;
                    if (Arrays.stream(before, 0, 5).filter(value -> value == selectedColor).count() < 3) continue;
                    int press = 1;
                    for (int i = 0; i < 5 && press <= 2; i++) if (colors[i] == color) advance(colors, i, press++);
                    break;
                }
            }
            case 3 -> {
                swap(colors, 0, 3); swap(colors, 5, 8);
                swap(colors, 2, 4); swap(colors, 7, 9);
                swap(colors, 1, 6);
            }
            case 4 -> {
                for (int row = 0; row < 2; row++) {
                    int start = row * 5;
                    boolean same = true;
                    for (int i = start + 1; i < start + 5; i++) same &= before[i] == before[start];
                    if (same) for (int offset : List.of(0, 2, 4)) advance(colors, start + offset, 1);
                }
            }
            case 5 -> {
                for (int column = 0; column < 5; column++) if (colors[column] == colors[column + 5]) {
                    colors[column] = 2;
                    colors[column + 5] = lastDigitEven ? 1 : 0;
                }
            }
            case 6 -> {
                if (Arrays.stream(colors).noneMatch(color -> color == 0)) {
                    colors[1] = colors[5] = colors[8] = 0;
                }
            }
            case 7 -> {
                if (Arrays.stream(colors).filter(color -> color == 1).count() > 5) {
                    int green = 0;
                    for (int i = 0; i < 10; i++) if (colors[i] == 1) {
                        green++;
                        if (green == 8) colors[i] = 2;
                        else if (green == 1 || green == 3 || green == 4) advance(colors, i, green == 3 ? 1 : 2);
                    }
                }
            }
            case 8 -> {
                for (int row = 0; row < 2; row++) {
                    for (int i = row * 5; i < row * 5 + 3; i++) if (colors[i] == colors[i + 1] && colors[i] == colors[i + 2]) {
                        advance(colors, i + 1, 1);
                        break;
                    }
                }
            }
            case 9 -> {
                for (int i = 0; i < 4; i++) if (colors[i] == colors[i + 1] && colors[i] == colors[i + 5] && colors[i] == colors[i + 6]) {
                    advance(colors, i, 2);
                    advance(colors, i + 6, 2);
                    break;
                }
            }
            default -> throw new IllegalArgumentException("Unknown rule: " + rule);
        }
    }

    private static void advance(int[] colors, int index, int count) { colors[index] = (colors[index] + count) % 3; }
    private static void swap(int[] colors, int first, int second) { int value = colors[first]; colors[first] = colors[second]; colors[second] = value; }
    private static List<String> colorNames(int[] colors) { return Arrays.stream(colors).mapToObj(COLORS::get).toList(); }
    private static List<List<String>> colorHistory(Object value) {
        if (!(value instanceof List<?> stages)) return new ArrayList<>();
        List<List<String>> history = new ArrayList<>();
        for (Object stage : stages) {
            if (!(stage instanceof List<?> colors)) return new ArrayList<>();
            history.add(colors.stream().map(String::valueOf).toList());
        }
        return history;
    }
}
