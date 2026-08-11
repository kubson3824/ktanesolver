package ktanesolver.module.modded.regular.threeleds;

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
    type = ModuleType.THREE_LEDS,
    id = "threeLEDsModule",
    name = "3 LEDs",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Set three colored LEDs using the state table or serial-number fallback.",
    tags = {"leds", "colors", "serial", "states"}
)
public class ThreeLedsSolver extends AbstractModuleSolver<ThreeLedsInput, ThreeLedsOutput> {
    private static final List<String> COLORS = List.of("WHITE", "RED", "BLUE", "GREEN", "YELLOW");
    private static final boolean[][] TABLE = {
        {true, false, true}, {true, false, false}, {false, true, false},
        {false, true, true}, {false, false, true}, {true, true, true}
    };

    @Override
    protected SolveResult<ThreeLedsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ThreeLedsInput input
    ) {
        if (input == null || input.colors() == null || input.initialStates() == null
            || input.colors().size() != 3 || input.initialStates().size() != 3) {
            return failure("Enter the color and initial state of all three LEDs");
        }
        List<String> colors = new ArrayList<>(3);
        boolean[] initial = new boolean[3];
        for (int index = 0; index < 3; index++) {
            String color = input.colors().get(index);
            Boolean state = input.initialStates().get(index);
            if (color == null || !COLORS.contains(color.trim().toUpperCase(Locale.ROOT)) || state == null) {
                return failure("Each LED needs a valid color and initial state");
            }
            colors.add(color.trim().toUpperCase(Locale.ROOT));
            initial[index] = state;
        }

        boolean[] target = initial.clone();
        int tableIndex = tableIndex(initial);
        if (tableIndex >= 0) {
            for (int led = 0; led < 3; led++) {
                target[led] = switch (colors.get(led)) {
                    case "WHITE" -> !initial[led];
                    case "RED", "BLUE" -> TABLE[tableIndex < 3 ? tableIndex + 3 : tableIndex - 3][led];
                    case "GREEN" -> TABLE[(tableIndex / 3) * 3 + (tableIndex + 2) % 3][led];
                    case "YELLOW" -> TABLE[(tableIndex / 3) * 3 + (tableIndex + 1) % 3][led];
                    default -> throw new IllegalStateException("Unexpected color");
                };
            }
        } else {
            for (char character : bomb.getSerialNumber().toCharArray()) {
                if (Character.isDigit(character)) {
                    int led = (character - '0') % 3;
                    target[led] = !target[led];
                }
            }
        }

        List<Boolean> targetStates = List.of(target[0], target[1], target[2]);
        List<Integer> toggles = new ArrayList<>();
        for (int led = 0; led < 3; led++) if (target[led] != initial[led]) toggles.add(led + 1);
        storeState(module, "threeLedsInitialState", bits(initial));
        return success(new ThreeLedsOutput(targetStates, List.copyOf(toggles)));
    }

    private static int tableIndex(boolean[] states) {
        for (int index = 0; index < TABLE.length; index++) {
            if (TABLE[index][0] == states[0] && TABLE[index][1] == states[1] && TABLE[index][2] == states[2]) return index;
        }
        return -1;
    }

    private static String bits(boolean[] states) {
        return "" + (states[0] ? '1' : '0') + (states[1] ? '1' : '0') + (states[2] ? '1' : '0');
    }
}
