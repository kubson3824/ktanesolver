package ktanesolver.module.modded.regular.simonscrambles;

import java.util.ArrayList;
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
    type = ModuleType.SIMON_SCRAMBLES,
    id = "simonScrambles",
    name = "Simon Scrambles",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Translate ten flashes through the position-specific scramble table.",
    tags = {"simon", "colors", "sequence", "memory"}
)
public class SimonScramblesSolver extends AbstractModuleSolver<SimonScramblesInput, SimonScramblesOutput> {
    private static final List<String> COLORS = List.of("BLUE", "YELLOW", "RED", "GREEN");
    private static final String[][] TABLE = {
        {"YELLOW", "GREEN", "BLUE", "RED"}, {"GREEN", "BLUE", "YELLOW", "RED"},
        {"RED", "GREEN", "YELLOW", "BLUE"}, {"RED", "YELLOW", "GREEN", "BLUE"},
        {"RED", "BLUE", "GREEN", "YELLOW"}, {"BLUE", "YELLOW", "RED", "GREEN"},
        {"YELLOW", "GREEN", "BLUE", "RED"}, {"YELLOW", "BLUE", "GREEN", "RED"},
        {"RED", "YELLOW", "BLUE", "GREEN"}, {"GREEN", "RED", "YELLOW", "BLUE"}
    };

    @Override
    protected SolveResult<SimonScramblesOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SimonScramblesInput input
    ) {
        if (input == null || input.flashes() == null || input.flashes().size() != 10) return failure("Enter exactly 10 flashing colors");
        List<String> flashes = new ArrayList<>(10);
        List<String> presses = new ArrayList<>(10);
        for (int i = 0; i < 10; i++) {
            String color = input.flashes().get(i) == null ? "" : input.flashes().get(i).trim().toUpperCase(Locale.ROOT);
            int column = COLORS.indexOf(color);
            if (column < 0) return failure("Flash colors must be blue, yellow, red, or green");
            flashes.add(display(color));
            presses.add(TABLE[i][column]);
        }
        storeState(module, "simonScramblesSequence", flashes);
        return success(new SimonScramblesOutput(List.copyOf(presses)));
    }

    private static String display(String color) {
        String value = color.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
