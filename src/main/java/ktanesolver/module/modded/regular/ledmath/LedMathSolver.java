package ktanesolver.module.modded.regular.ledmath;

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
    type = ModuleType.LED_MATH,
    id = "lgndLEDMath",
    name = "LED Math",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Convert three colored LEDs into an edgework-based arithmetic result.",
    tags = {"leds", "colors", "math", "edgework"}
)
public class LedMathSolver extends AbstractModuleSolver<LedMathInput, LedMathOutput> {
    private enum Color { RED, BLUE, GREEN, YELLOW }

    @Override
    protected SolveResult<LedMathOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, LedMathInput input
    ) {
        Color a = color(input == null ? null : input.ledA());
        Color b = color(input == null ? null : input.ledB());
        Color operatorColor = color(input == null ? null : input.operator());
        if (a == null || b == null || operatorColor == null) return failure("Select red, blue, green, or yellow for all three LEDs");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.chars().noneMatch(Character::isDigit)) return failure("A serial number containing a digit is required");

        int batteries = bomb.getBatteryCount();
        int holders = bomb.getBatteryHolders();
        int indicators = bomb.getIndicators().size();
        int serialDigit = serial.chars().filter(Character::isDigit).reduce((first, last) -> last).orElseThrow() - '0';
        int valueA = switch (a) {
            case RED -> (batteries + indicators) * 2;
            case BLUE -> serialDigit * 3 + indicators;
            case GREEN -> batteries - serialDigit - 7;
            case YELLOW -> batteries * holders + 4;
        };
        int valueB = b == a ? 8 - holders + batteries
            : b == operatorColor ? indicators + holders + 1
            : b == Color.BLUE || b == Color.YELLOW ? (serialDigit + holders) * 5
            : (serialDigit - batteries) * 6;
        String operator = operatorColor == Color.RED ? "+" : operatorColor == Color.BLUE ? "-" : "×";
        int answer = switch (operator) {
            case "+" -> valueA + valueB;
            case "-" -> valueA - valueB;
            default -> valueA * valueB;
        };
        storeState(module, "ledMathColors", List.of(display(a), display(b), display(operatorColor)));
        return success(new LedMathOutput(valueA, valueB, operator, answer));
    }

    private static Color color(String value) {
        if (value == null) return null;
        try { return Color.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException ignored) { return null; }
    }

    private static String display(Color color) {
        String value = color.name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
