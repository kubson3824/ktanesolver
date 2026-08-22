package ktanesolver.module.modded.regular.misorderedkeys;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
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
        type = ModuleType.MISORDERED_KEYS,
        id = "misorderedKeys",
        name = "Misordered Keys",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Decode both value permutations and press the six resulting positions in order.",
        tags = {"keys", "colors", "permutations"})
public class MisorderedKeysSolver extends AbstractModuleSolver<MisorderedKeysInput, MisorderedKeysOutput> {
    private static final int[][] COLOR_GRID = {
            {1, 0, 3, 4, 5, 2}, {4, 1, 2, 5, 0, 3}, {3, 4, 1, 0, 2, 5},
            {0, 5, 4, 2, 3, 1}, {2, 3, 5, 1, 4, 0}, {5, 2, 0, 3, 1, 4}};
    private static final int[][] POSITION_GRID = {
            {5, 4, 2, 3, 0, 1}, {2, 0, 4, 1, 5, 3}, {1, 2, 5, 0, 3, 4},
            {0, 3, 1, 2, 4, 5}, {4, 1, 3, 5, 2, 0}, {3, 5, 0, 4, 1, 2}};
    private static final int[][] FIRST_VALUE_GRID = {
            {1, 5, 6, 2, 3, 4}, {3, 4, 1, 5, 6, 2}, {6, 2, 3, 1, 4, 5},
            {2, 3, 5, 4, 1, 6}, {5, 6, 4, 3, 2, 1}, {4, 1, 2, 6, 5, 3}};
    private static final int[][] SINGLE_DIGIT_GRID = {
            {2, 1, 5, 3, 4, 6}, {6, 3, 2, 1, 5, 4}, {5, 4, 3, 6, 2, 1},
            {3, 6, 4, 2, 1, 5}, {1, 5, 6, 4, 3, 2}, {4, 2, 1, 5, 6, 3}};
    private static final int[][] MULTI_DIGIT_GRID = {
            {3, 1, 0, 4, 5, 2}, {0, 2, 1, 5, 3, 4}, {4, 5, 3, 0, 2, 1},
            {2, 3, 5, 1, 4, 0}, {1, 4, 2, 3, 0, 5}, {5, 0, 4, 2, 1, 3}};

    @Override
    protected SolveResult<MisorderedKeysOutput> doSolve(
            RoundEntity round, BombEntity bomb, ModuleEntity module, MisorderedKeysInput input) {
        if (input == null || input.keys() == null || input.keys().size() != 6
                || input.highlightedPosition() < 1 || input.highlightedPosition() > 6
                || input.keys().stream().anyMatch(this::invalid)) {
            return failure("Enter six complete keys, labels of 1–6 digits, and K's position");
        }

        List<Integer> first = new ArrayList<>();
        for (int position = 0; position < 6; position++) {
            var key = input.keys().get(position);
            int firstDigit = key.label().charAt(0) - '1';
            int column = COLOR_GRID[key.labelColor().ordinal()][key.keyColor().ordinal()];
            int row = POSITION_GRID[position][firstDigit];
            first.add(FIRST_VALUE_GRID[row][column]);
        }
        if (new HashSet<>(first).size() != 6) {
            return failure("The entered keys do not decode to a permutation of first values 1–6");
        }

        int k = input.highlightedPosition() - 1;
        List<Integer> second = new ArrayList<>(List.of(0, 0, 0, 0, 0, 0));
        Set<Integer> available = new HashSet<>(List.of(1, 2, 3, 4, 5, 6));
        for (int position = 0; position < 6; position++) {
            if (position == k) continue;
            var key = input.keys().get(position);
            int[] counts = counts(key.label());
            int sum = 0, distinct = 0, unique = 0;
            for (int digit = 0; digit < 6; digit++) {
                sum += (digit + 1) * counts[digit];
                if (counts[digit] > 0) distinct++;
                if (counts[digit] == 1) unique++;
            }
            int firstDigit = key.label().charAt(0) - '0';
            int lastDigit = key.label().charAt(key.label().length() - 1) - '0';
            var candidates = new ArrayList<Integer>();
            if (key.label().length() == 1) candidates.add(positionOf(first, firstDigit));
            if (unique >= 3) candidates.add(first.get(k));
            if (sum > 15) candidates.add(first.get(lastDigit - 1));
            if (distinct < 3) candidates.add(positionOf(first, lastDigit));
            if (counts[0] == 0 && counts[2] == 0 && counts[4] == 0) candidates.add(positionOf(first, position + 1));
            if (counts[0] > 0 && counts[5] > 0) candidates.add(positionOf(first, input.keys().get(k).label().charAt(0) - '0'));
            int evenKinds = (counts[1] > 0 ? 1 : 0) + (counts[3] > 0 ? 1 : 0) + (counts[5] > 0 ? 1 : 0);
            if (evenKinds >= 2) candidates.add(positionOf(first, input.keys().get(k).label().charAt(input.keys().get(k).label().length() - 1) - '0'));
            if (key.label().length() == 1) {
                candidates.add(SINGLE_DIGIT_GRID[firstDigit - 1][key.labelColor().ordinal()]);
            } else {
                int selector = MULTI_DIGIT_GRID[lastDigit - 1][key.labelColor().ordinal()];
                candidates.add(switch (selector) {
                    case 0 -> firstDigit;
                    case 1 -> lastDigit;
                    case 2 -> key.label().length();
                    case 3 -> sum % 6 + 1;
                    case 4 -> position + 1;
                    default -> minimumModal(counts);
                });
            }
            int value = candidates.stream().filter(available::contains).findFirst().orElseGet(() -> available.stream().min(Integer::compareTo).orElseThrow());
            second.set(position, value);
            available.remove(value);
        }
        second.set(k, available.iterator().next());

        List<Integer> keyIndexes = new ArrayList<>(List.of(0, 1, 2, 3, 4, 5));
        keyIndexes.sort(Comparator.comparingInt(second::get));
        List<Integer> order = keyIndexes.stream().map(first::get).toList();
        String command = "press " + order.stream().map(String::valueOf).reduce("", String::concat);
        storeState(module, "misorderedKeysKeys", input.keys());
        if (!module.getState().containsKey("misorderedKeysK")) {
            storeState(module, "misorderedKeysK", input.highlightedPosition());
        }
        return success(new MisorderedKeysOutput(first, second, order, command));
    }

    private boolean invalid(MisorderedKeysInput.Key key) {
        return key == null || key.keyColor() == null || key.labelColor() == null || key.label() == null
                || !key.label().matches("[1-6]{1,6}");
    }

    private static int[] counts(String label) {
        int[] counts = new int[6];
        label.chars().forEach(ch -> counts[ch - '1']++);
        return counts;
    }

    private static int positionOf(List<Integer> values, int value) {
        return values.indexOf(value) + 1;
    }

    private static int minimumModal(int[] counts) {
        int best = 0;
        for (int digit = 1; digit < 6; digit++) if (counts[digit] > counts[best]) best = digit;
        return best + 1;
    }
}
