package ktanesolver.module.modded.regular.lombaxcubes;

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
@ModuleInfo(type = ModuleType.LOMBAX_CUBES, id = "lgndLombaxCubes", name = "Lombax Cubes",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Decode the six cube nets and determine the countdown digit for the button.",
    tags = {"cubes", "lombax", "letters", "timer"})
public class LombaxCubesSolver extends AbstractModuleSolver<LombaxCubesInput, LombaxCubesOutput> {
    private static final List<String> COLORS = List.of("Red", "Blue", "Green", "Yellow", "Purple", "White");

    @Override protected SolveResult<LombaxCubesOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, LombaxCubesInput input) {
        if (input == null || input.buttonLetters() == null || input.buttonColor() == null || input.cubeFaces() == null)
            return failure("Enter the button and all six cube nets");
        String letters = input.buttonLetters().trim().toUpperCase(Locale.ROOT);
        if (!letters.matches("[A-Z]{2}")) return failure("Button letters must contain exactly two letters");
        int buttonColor = indexOfColor(input.buttonColor());
        if (buttonColor < 0) return failure("Choose a valid button color");
        if (input.cubeFaces().size() != 6) return failure("Enter six cube nets in red-to-white order");
        List<Integer> values = input.cubeFaces().stream().map(face -> face == null ? "" : face.trim().toUpperCase(Locale.ROOT)).map(face -> {
            if (!face.matches("[A-Z]{6}")) return null;
            int[] n = face.chars().map(c -> c - 'A' + 1).toArray();
            return Math.abs((n[0] + n[1] + n[2] - n[3]) * n[4] - n[5]);
        }).toList();
        if (values.stream().anyMatch(java.util.Objects::isNull)) return failure("Each cube net must contain its A-F face letters as six letters");

        int left = letters.charAt(0) - 'A' + 1, right = letters.charAt(1) - 'A' + 1;
        if (left == right) right += 2;
        left = (left - 1) % 6 + 1; right = (right - 1) % 6 + 1;
        if (left == right) left += left < 6 ? 1 : -1;
        int x = left - 1, y = right - 1, digit;
        if (values.get(x) + values.get(y) > 999) digit = values.get(5) % 10;
        else if (values.get(y) < 50) digit = values.get(0) % 10;
        else if (values.get(x) - values.get(y) > 100) digit = values.get(3) % 10;
        else if (buttonColor == x || buttonColor == y) digit = values.get(1) % 10;
        else if (x == 0 || y == 3) digit = values.get(4) % 10;
        else digit = values.get(2) % 10;

        storeState(module, "lombaxCubesButtonLetters", List.of(letters.substring(0, 1), letters.substring(1)));
        return success(new LombaxCubesOutput(values, COLORS.get(x), COLORS.get(y), digit));
    }

    private static int indexOfColor(String value) {
        for (int i = 0; i < COLORS.size(); i++) if (COLORS.get(i).equalsIgnoreCase(value.trim())) return i;
        return -1;
    }
}
