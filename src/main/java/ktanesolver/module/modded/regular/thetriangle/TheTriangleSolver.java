package ktanesolver.module.modded.regular.thetriangle;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    type = ModuleType.THE_TRIANGLE,
    id = "triangle",
    name = "The Triangle",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Use rotation, artwork, and a letter to press the correct colored triangle.",
    tags = {"color", "lookup", "multi-stage"}
)
public class TheTriangleSolver extends AbstractModuleSolver<TheTriangleInput, TheTriangleOutput> {
    private static final List<String> POSITIONS = List.of("MID", "TL", "BL", "BR");
    private static final List<String> VALID_COLORS = List.of("BLUE", "GREEN", "RED", "YELLOW");
    private static final Map<String, String> TABLE = table();

    @Override
    protected SolveResult<TheTriangleOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, TheTriangleInput input
    ) {
        if (input == null || input.rotation() == null || input.artwork() == null || input.letter() == null || input.colors() == null) {
            return failure("Enter the rotation, artwork, letter, and all four current triangle colors");
        }
        String rotation = normalize(input.rotation()), artwork = normalize(input.artwork()), letter = normalize(input.letter());
        if (rotation.equals("CLOCKWISE")) rotation = "CW";
        if (rotation.equals("COUNTERCLOCKWISE")) rotation = "CCW";
        String target = TABLE.get(rotation + ":" + artwork + ":" + letter);
        if (target == null) return failure("Use CW or CCW, Picasso/Cool/Concentric, and T/R/N/G");
        List<String> colors = input.colors().stream().map(TheTriangleSolver::normalize).toList();
        if (colors.size() != 4 || !new HashSet<>(colors).containsAll(VALID_COLORS) || new HashSet<>(colors).size() != 4) {
            return failure("Enter each of blue, green, red, and yellow exactly once in MID/TL/BL/BR order");
        }
        String position = POSITIONS.get(colors.indexOf(target));
        List<String> completed = strings(module.getState().get("triangleCompletedPositions"));
        if (!completed.contains(position)) completed.add(position);
        storeState(module, "triangleCompletedPositions", List.copyOf(completed));
        return success(new TheTriangleOutput(target, position, List.copyOf(completed)), completed.size() == 4);
    }

    private static Map<String, String> table() {
        Map<String, String> table = new HashMap<>();
        String[][] rows = {
            {"CW", "PICASSO", "GREEN", "RED", "BLUE", "YELLOW"}, {"CW", "COOL", "RED", "YELLOW", "BLUE", "GREEN"},
            {"CW", "CONCENTRIC", "BLUE", "GREEN", "RED", "YELLOW"}, {"CCW", "PICASSO", "YELLOW", "BLUE", "GREEN", "RED"},
            {"CCW", "COOL", "GREEN", "RED", "YELLOW", "BLUE"}, {"CCW", "CONCENTRIC", "RED", "BLUE", "YELLOW", "GREEN"}
        };
        String[] letters = {"T", "R", "N", "G"};
        for (String[] row : rows) for (int i = 0; i < 4; i++) table.put(row[0] + ":" + row[1] + ":" + letters[i], row[i + 2]);
        return Map.copyOf(table);
    }
    private static String normalize(String value) { return value.trim().toUpperCase(Locale.ROOT).replace(" ", ""); }
    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> list)) return new ArrayList<>();
        return new ArrayList<>(list.stream().map(String::valueOf).toList());
    }
}
