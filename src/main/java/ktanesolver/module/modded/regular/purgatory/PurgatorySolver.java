package ktanesolver.module.modded.regular.purgatory;

import java.util.Locale;
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
import ktanesolver.module.modded.regular.purgatory.PurgatoryOutput.Destination;
import ktanesolver.module.modded.regular.purgatory.PurgatoryOutput.Timing;

@Service
@ModuleInfo(type = ModuleType.PURGATORY, id = "PurgatoryModule", name = "Purgatory",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Decide whether each named person goes to Heaven or Hell and when to press.",
    tags = {"heaven", "hell", "led", "stages", "edgework"})
public class PurgatorySolver extends AbstractModuleSolver<PurgatoryInput, PurgatoryOutput> {
    @Override protected SolveResult<PurgatoryOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PurgatoryInput input) {
        if (input == null || input.ledColor() == null || input.personName() == null) return failure("Enter the current LED and person's name");
        if (input.stage() < 1 || input.stage() > 5) return failure("Stage must be between 1 and 5");
        String color = input.ledColor().trim().toUpperCase(Locale.ROOT), name = input.personName().trim();
        if (!color.matches("RED|BLUE|GREEN|YELLOW")) return failure("LED color must be red, blue, green, or yellow");
        if (name.isEmpty()) return failure("Enter the person's name");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");
        PurgatoryOutput output = color.equals("YELLOW") ? yellow(bomb, input.flickering())
            : bomb.serialHasVowel() ? vowel(bomb, color, name, input.flickering()) : noVowel(bomb, color, name);
        return success(output, input.stage() == 5 || color.equals("YELLOW"));
    }

    private static PurgatoryOutput vowel(BombEntity bomb, String color, String name, boolean flicker) {
        return switch (color) {
            case "RED" -> out(bomb.getBatteryCount() >= 2 ? Destination.HELL : Destination.HEAVEN);
            case "BLUE" -> flicker ? new PurgatoryOutput(Destination.HELL, Timing.AT_END, 1)
                : out(bomb.getBatteryCount() < 4 ? Destination.HEAVEN : Destination.HELL);
            case "GREEN" -> bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count() == 2 ? out(Destination.HELL)
                : name.length() <= 5 ? new PurgatoryOutput(Destination.HEAVEN, Timing.ON_TWO, 1) : out(Destination.HELL);
            default -> throw new IllegalStateException();
        };
    }

    private static PurgatoryOutput noVowel(BombEntity bomb, String color, String name) {
        return switch (color) {
            case "RED" -> bomb.isIndicatorLit("SIG") ? out(Destination.HELL)
                : name.length() % 2 == 0 ? out(Destination.HEAVEN) : noVowel(bomb, "GREEN", name);
            case "BLUE" -> bomb.hasPort(PortType.PARALLEL) || bomb.hasPort(PortType.SERIAL) ? out(Destination.HELL)
                : name.length() % 2 == 1 && bomb.getBatteryCount() > 2 ? out(Destination.HEAVEN)
                : new PurgatoryOutput(Destination.EITHER, Timing.NOW,
                    bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').sum());
            case "GREEN" -> bomb.getBatteryCount() > 3 ? out(Destination.HELL)
                : bomb.getBatteryCount() < 3 ? out(Destination.HEAVEN) : out(Destination.EITHER);
            default -> throw new IllegalStateException();
        };
    }

    private static PurgatoryOutput yellow(BombEntity bomb, boolean flicker) {
        int strikes = Math.min(2, Math.max(0, bomb.getStrikes())), score = 0;
        if (bomb.hasPort(PortType.PARALLEL)) score += new int[]{1,-1,-2}[strikes];
        if (bomb.getBatteryCount() > 2) score += new int[]{-1,-2,1}[strikes];
        if (bomb.isIndicatorLit("SIG")) score += new int[]{1,1,-1}[strikes];
        if (bomb.isIndicatorUnlit("SIG")) score += new int[]{-1,-2,-1}[strikes];
        if (flicker) score += new int[]{1,-2,-1}[strikes];
        return new PurgatoryOutput(score >= 0 ? Destination.HEAVEN : Destination.HELL, Timing.AT_END, 1);
    }
    private static PurgatoryOutput out(Destination destination) { return new PurgatoryOutput(destination, Timing.NOW, 1); }
}
