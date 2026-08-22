package ktanesolver.module.modded.regular.burgeralarm;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
import ktanesolver.module.modded.regular.burgeralarm.BurgerAlarmInput.Ingredient;

@Service
@ModuleInfo(
    type = ModuleType.BURGER_ALARM,
    id = "burgerAlarm",
    name = "Burger Alarm",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Derive the table swaps from the code and ingredient layout, then assemble all five orders.",
    tags = {"burger", "grid", "edgework", "orders"}
)
public class BurgerAlarmSolver extends AbstractModuleSolver<BurgerAlarmInput, BurgerAlarmOutput> {
    private static final int[][] TABLE = {
        {0,6,3,4,8,5,0,6,5,5}, {5,1,0,6,8,1,7,7,5,6},
        {6,2,3,2,9,4,3,8,5,1}, {8,8,3,8,3,9,2,2,6,7},
        {6,9,9,1,7,9,8,2,4,1}, {4,9,8,2,0,8,0,5,0,9},
        {9,1,1,1,9,6,2,7,5,3}, {1,7,3,6,0,0,0,0,4,2},
        {5,4,1,9,2,7,2,3,4,7}, {3,8,4,7,6,3,7,4,5,4}
    };
    private static final int[][] ADJACENT = {
        {1,3}, {0,2,4}, {1,5}, {0,4,6}, {1,3,5,7},
        {2,4,8}, {3,7}, {4,6,8,9}, {7,5}, {7}
    };

    @Override
    protected SolveResult<BurgerAlarmOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, BurgerAlarmInput input
    ) {
        if (input == null || input.buttonIngredients() == null || input.buttonIngredients().size() != 10
            || input.buttonIngredients().stream().anyMatch(ingredient -> ingredient == null)
            || input.buttonIngredients().stream().distinct().count() != 10) {
            return failure("Place each of the ten ingredients exactly once");
        }
        if (input.displayedCode() == null || !input.displayedCode().matches("\\d{7}")) return failure("Enter the seven-digit code");
        if (input.orders() == null || input.orders().size() != 5 || input.orders().stream().anyMatch(order -> order == null || !order.matches("\\d{2}"))) {
            return failure("Enter all five two-digit orders, preserving leading zeroes");
        }
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.length() < 6) return failure("Enter the bomb serial number first");

        int[] positions = new int[10];
        for (int position = 0; position < 10; position++) positions[input.buttonIngredients().get(position).ordinal()] = position;
        boolean clock = hasModule(bomb, ModuleType.THE_CLOCK, ModuleType.RUBIKS_CLOCK);
        boolean food = hasModule(bomb, ModuleType.ICE_CREAM, ModuleType.COOKING, ModuleType.COOKIE_JARS, ModuleType.PIE);
        int[] offsets = {
            "2357".indexOf(serial.charAt(5)) >= 0 ? in(positions[Ingredient.KETCHUP.ordinal()], 3,4,5) ? 7 : 4 : in(positions[Ingredient.CHEESE.ordinal()], 2,5,8) ? 6 : 3,
            clock ? row(positions[Ingredient.PICKLES.ordinal()]) == row(positions[Ingredient.MAYO.ordinal()]) ? 0 : 1
                : column(positions[Ingredient.TOMATO.ordinal()]) == column(positions[Ingredient.BUN.ordinal()]) ? 8 : 2,
            bomb.getDBatteryCount() == 0 ? in(positions[Ingredient.MUSTARD.ordinal()], 6,7,8) ? 9 : 5
                : column(positions[Ingredient.MEAT.ordinal()]) != 1 ? 3 : 7,
            bomb.hasPort(PortType.HDMI) || input.pcmciaPresent() ? positions[Ingredient.LETTUCE.ordinal()] > 7 ? 1 : 0
                : adjacent(positions[Ingredient.PICKLES.ordinal()], positions[Ingredient.MUSTARD.ordinal()]) ? 4 : 8,
            input.twoFactorPresent() ? !in(positions[Ingredient.ONIONS.ordinal()], 6,9) ? 8 : 3
                : !adjacent(positions[Ingredient.KETCHUP.ordinal()], positions[Ingredient.MAYO.ordinal()]) ? 6 : 9,
            bomb.hasIndicator("NLL") || bomb.hasIndicator("SND") ? positions[Ingredient.TOMATO.ordinal()] > 5 ? 1 : 0
                : positions[Ingredient.BUN.ordinal()] < 6 ? 4 : 5,
            serial.toUpperCase().matches(".*[BURG3].*") ? row(positions[Ingredient.CHEESE.ordinal()]) > row(positions[Ingredient.MAYO.ordinal()]) ? 5 : 9
                : row(positions[Ingredient.KETCHUP.ordinal()]) < row(positions[Ingredient.BUN.ordinal()]) ? 3 : 7,
            food ? column(positions[Ingredient.MUSTARD.ordinal()]) < column(positions[Ingredient.MEAT.ordinal()]) ? 1 : 0
                : column(positions[Ingredient.BUN.ordinal()]) > column(positions[Ingredient.LETTUCE.ordinal()]) ? 4 : 8
        };

        int[] digits = input.displayedCode().chars().map(character -> character - '0').toArray();
        int[] swaps = new int[8];
        for (int i = 0; i < 7; i++) swaps[i] = (offsets[i] + digits[i]) % 10;
        swaps[7] = (offsets[7] + Arrays.stream(digits).sum()) % 10;
        if (Arrays.stream(swaps).distinct().count() != 8) return failure("The code and layout produce duplicate swap indexes; check the entered module details");

        int[] rows = {0,1,2,3,4,5,6,7,8,9};
        int[] columns = {0,1,2,3,4,5,6,7,8,9};
        swap(rows, swaps[0], swaps[1]);
        swap(columns, swaps[2], swaps[3]);
        swap(rows, swaps[4], swaps[5]);
        swap(columns, swaps[6], swaps[7]);

        List<Ingredient> presses = new ArrayList<>(7);
        presses.add(Ingredient.BUN);
        for (String order : input.orders()) {
            int row = order.charAt(0) - '0';
            int column = order.charAt(1) - '0';
            presses.add(Ingredient.values()[TABLE[rows[row]][columns[column]]]);
        }
        presses.add(Ingredient.BUN);

        storeState(module, "burgerAlarmDigits", Arrays.stream(digits).boxed().toList());
        storeState(module, "burgerAlarmOrders", List.copyOf(input.orders()));
        return success(new BurgerAlarmOutput(
            Arrays.stream(offsets).boxed().toList(), Arrays.stream(swaps).boxed().toList(), List.copyOf(presses)));
    }

    private static boolean hasModule(BombEntity bomb, ModuleType... types) {
        List<ModuleType> wanted = List.of(types);
        return bomb.getModules().stream().anyMatch(candidate -> wanted.contains(candidate.getType()));
    }
    private static boolean adjacent(int first, int second) { return Arrays.stream(ADJACENT[first]).anyMatch(value -> value == second); }
    private static boolean in(int value, int... options) { return Arrays.stream(options).anyMatch(option -> option == value); }
    private static int row(int position) { return position / 3; }
    private static int column(int position) { return position == 9 ? 1 : position % 3; }
    private static void swap(int[] values, int first, int second) { int value = values[first]; values[first] = values[second]; values[second] = value; }
}
