package ktanesolver.module.modded.regular.stackem;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
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
    type = ModuleType.STACK_EM, id = "stackem", name = "Stack'em",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Derive the six cube values from the serial number and build four stacks with the displayed sums.",
    tags = {"cubes", "serial number", "arithmetic"}
)
public class StackemSolver extends AbstractModuleSolver<StackemInput, StackemOutput> {
    private static final List<String> COLORS = List.of("Blue", "Green", "Orange", "Magenta", "Red", "Yellow");

    @Override
    protected SolveResult<StackemOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, StackemInput input) {
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.length() != 6) return failure("Enter the six-character bomb serial number first");
        if (input == null || input.targetSums() == null || input.targetSums().size() != 4
            || input.targetSums().stream().anyMatch(value -> value == null || value < 1 || value > 30)) {
            return failure("Enter four target sums from 1 to 30");
        }

        String reversed = new StringBuilder(serial.toUpperCase()).reverse().toString();
        List<Integer> reduced = reversed.chars().map(c -> Math.floorMod((Character.isDigit(c) ? c - '0' : c - 'A' + 1) - 1, 6) + 1).boxed().toList();
        List<Integer> order = IntStream.range(0, 6).boxed().sorted(Comparator.comparingInt(reduced::get)).toList();
        int[] values = new int[6];
        for (int rank = 0; rank < 6; rank++) values[order.get(rank)] = rank + 1;

        Map<String, Integer> cubeValues = new LinkedHashMap<>();
        for (int i = 0; i < 6; i++) cubeValues.put(COLORS.get(i), values[i]);
        String six = COLORS.get(indexOf(values, 6));
        List<List<String>> stacks = new ArrayList<>();
        for (int target : input.targetSums()) {
            List<String> stack = new ArrayList<>();
            for (int i = 0; i < target / 6; i++) stack.add(six);
            if (target % 6 != 0) stack.add(COLORS.get(indexOf(values, target % 6)));
            stacks.add(List.copyOf(stack));
        }
        return success(new StackemOutput(Map.copyOf(cubeValues), List.copyOf(stacks)));
    }

    private static int indexOf(int[] values, int value) {
        for (int i = 0; i < values.length; i++) if (values[i] == value) return i;
        throw new IllegalStateException("Cube values must be a permutation of 1 through 6");
    }
}
