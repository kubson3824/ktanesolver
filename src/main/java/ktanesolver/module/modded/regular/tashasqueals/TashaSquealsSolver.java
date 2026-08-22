package ktanesolver.module.modded.regular.tashasqueals;

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
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.tashasqueals.TashaSquealsInput.Color;

@Service
@ModuleInfo(
    type = ModuleType.TASHA_SQUEALS,
    id = "tashaSqueals",
    name = "Tasha Squeals",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Use the button layout, stage, and battery parity to decode all five flashes.",
    tags = {"simon", "colors", "sequence", "batteries"}
)
public class TashaSquealsSolver extends AbstractModuleSolver<TashaSquealsInput, TashaSquealsOutput> {
    // [table][flashing position: top/right/bottom/left][flashed color] = color to press
    private static final int[][][] TABLES = {
        {{0,2,1,3}, {3,2,0,1}, {0,0,0,0}, {1,3,2,0}},
        {{3,0,1,2}, {0,3,2,1}, {2,1,3,0}, {0,0,0,0}},
        {{3,1,0,2}, {0,0,0,0}, {2,0,1,3}, {2,1,3,0}},
        {{0,0,0,0}, {1,3,2,0}, {0,1,3,2}, {1,2,0,3}}
    };
    private static final Color[] COLORS = Color.values();

    @Override
    protected SolveResult<TashaSquealsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, TashaSquealsInput input
    ) {
        if (input == null || input.top() == null || input.right() == null || input.bottom() == null || input.left() == null) {
            return failure("Choose the color at all four positions");
        }
        Color[] layout = {input.top(), input.right(), input.bottom(), input.left()};
        if (Arrays.stream(layout).distinct().count() != 4) return failure("Use each button color exactly once");
        if (input.flashedColors() == null || input.flashedColors().size() != 5 || input.flashedColors().stream().anyMatch(color -> color == null)) {
            return failure("Choose all five flashed colors in order");
        }

        int pinkPosition = position(layout, Color.PINK);
        boolean evenBatteries = bomb.getBatteryCount() % 2 == 0;
        List<Color> presses = new ArrayList<>(5);
        for (int stage = 0; stage < 5; stage++) {
            int table;
            boolean secondOrFifth = stage == 1 || stage == 4;
            boolean fourth = stage == 3;
            boolean prime = stage == 1 || stage == 2 || stage == 4;
            if ((pinkPosition == 0) ^ secondOrFifth) table = 0;
            else if ((pinkPosition == 3) ^ fourth) table = 1;
            else if (prime ^ evenBatteries) table = 2;
            else table = 3;
            Color flash = input.flashedColors().get(stage);
            presses.add(COLORS[TABLES[table][position(layout, flash)][flash.ordinal()]]);
        }

        List<List<Color>> sequences = new ArrayList<>(5);
        for (int stage = 1; stage <= 5; stage++) sequences.add(List.copyOf(presses.subList(0, stage)));
        storeState(module, "tashaSquealsFlashes", input.flashedColors().stream().map(TashaSquealsSolver::display).toList());
        return success(new TashaSquealsOutput(List.copyOf(presses), List.copyOf(sequences)));
    }

    private static int position(Color[] layout, Color color) {
        for (int i = 0; i < layout.length; i++) if (layout[i] == color) return i;
        throw new IllegalArgumentException("Color is absent from the layout");
    }

    private static String display(Color color) {
        String name = color.name().toLowerCase();
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }
}
