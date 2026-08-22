package ktanesolver.module.modded.regular.thehexabutton;

import java.util.List;
import java.util.Locale;
import java.util.Set;
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

@Service
@ModuleInfo(
    type = ModuleType.THE_HEXABUTTON,
    id = "hexabutton",
    name = "The Hexabutton",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Determine whether to tap or hold the hexagonal button and when to act.",
    tags = {"button", "hold", "timing", "morse", "two-factor"}
)
public class TheHexabuttonSolver extends AbstractModuleSolver<TheHexabuttonInput, TheHexabuttonOutput> {
    private static final Set<String> LABELS = Set.of("JUMP", "BOOM", "CLAIM", "BUTTON", "HOLD", "BLUE");
    private static final Set<String> BUTTON_COLORS = Set.of("BLACK", "BLUE", "RED", "YELLOW", "GREEN");
    private static final Set<String> LIGHT_COLORS = Set.of("BLUE", "CYAN", "GRAY", "GREEN", "MAGENTA", "PURPLE", "WHITE");

    @Override
    protected SolveResult<TheHexabuttonOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, TheHexabuttonInput input
    ) {
        if (input == null) return failure("Enter the button label and color");
        String label = normalize(input.label()), buttonColor = normalize(input.buttonColor());
        if (!LABELS.contains(label) || !BUTTON_COLORS.contains(buttonColor)) return failure("Select a valid button label and color");
        List<Integer> twoFactors = input.twoFactorCodes() == null ? List.of() : input.twoFactorCodes();
        if (twoFactors.stream().anyMatch(code -> code == null || code < 0 || code > 999999)) return failure("Two-factor codes must be between 000000 and 999999");
        TapRule tap = tapRule(bomb, label, buttonColor, twoFactors);
        if (tap != null) return success(new TheHexabuttonOutput("TAP", false, tap.condition(), tap.time(), null, null, null));

        String lightType = normalize(input.lightType());
        if (lightType.isEmpty()) return success(new TheHexabuttonOutput("HOLD", true, "Hold until the entire button lights, then enter its behavior.", null, null, null, null), false);
        if (!Set.of("SOLID", "FLICKERING", "MORSE").contains(lightType)) return failure("Light type must be solid, flickering, or Morse");
        String lightColor = normalize(input.lightColor()), morseLetter = normalize(input.morseLetter());
        ReleaseRule release;
        if (lightType.equals("MORSE")) {
            if (!morseLetter.matches("[A-Z]")) return failure("Enter the transmitted Morse letter");
            release = morseRule(bomb, morseLetter.charAt(0));
            storeState(module, "hexabuttonMorseLetter", morseLetter);
        } else {
            if (!LIGHT_COLORS.contains(lightColor)) return failure("Select the held button's light color");
            release = releaseRule(bomb, lightType, lightColor);
            storeState(module, "hexabuttonLightType", lightType);
            storeState(module, "hexabuttonLightColor", display(lightColor));
        }
        return success(new TheHexabuttonOutput("RELEASE", false, release.condition(), release.time(), lightType, lightColor, lightType.equals("MORSE") ? morseLetter : null));
    }

    private static TapRule tapRule(BombEntity bomb, String label, String color, List<Integer> twoFactors) {
        if (bomb.hasIndicator("SND") || bomb.hasIndicator("TRN")) return null;
        if (bomb.getBatteryCount() > 4) return new TapRule("Tap when total seconds are a multiple of 34.", "9:38");
        if (!twoFactors.isEmpty()) {
            Integer suffix = twoFactors.stream().map(code -> code % 100).filter(value -> value < 60).findFirst().orElse(null);
            return suffix == null ? new TapRule("No entered two-factor code has two least-significant digits below 60; the source rule has no reachable timer value.", null)
                : new TapRule("Tap when the seconds equal a two-factor code's two least-significant digits.", time(suffix));
        }
        if (label.equals("HOLD")) return new TapRule("Tap when at least three timer digits are the same.", "3:33");
        if (color.equals("RED") || color.equals("GREEN")) {
            int divisor = bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').sum() % 10;
            return divisor == 0 ? new TapRule("The serial digit sum modulo 10 is 0; tap at any time.", "9:59")
                : new TapRule("Tap when total seconds are a multiple of " + divisor + ".", latestMultiple(divisor));
        }
        if (color.equals("YELLOW") || label.equals("JUMP")) return null;
        if (bomb.getIndicators().size() > 4) return new TapRule("Tap while the remaining minutes are even and nonzero.", "8:00");
        return null;
    }

    private static ReleaseRule releaseRule(BombEntity bomb, String type, String color) {
        if (type.equals("SOLID")) return switch (color) {
            case "PURPLE" -> new ReleaseRule("Release when the seconds digits show 00.", "9:00");
            case "CYAN" -> new ReleaseRule("Release when total seconds are a multiple of 4.", "9:56");
            case "GRAY" -> bomb.getModules().size() > 101
                ? new ReleaseRule("There are over 101 modules; release at any time.", "9:59")
                : new ReleaseRule("Release when total seconds are a multiple of the module count (" + bomb.getModules().size() + ").", latestMultiple(Math.max(1, bomb.getModules().size())));
            default -> new ReleaseRule("Release when total seconds modulo 300 are within 5 of a prime.", "9:57");
        };
        if (color.equals("GREEN")) return new ReleaseRule("Release while the remaining minutes are odd or zero.", "9:59");
        if (color.equals("CYAN")) return new ReleaseRule("Release when total seconds are a multiple of 7.", "9:55");
        if (color.equals("MAGENTA")) return new ReleaseRule("Release when the timer contains both a 5 and a 0.", "5:50");
        long unsolved = bomb.getModules().stream().filter(candidate -> !candidate.isSolved()).count();
        return unsolved <= 1 ? new ReleaseRule("This is the last unsolved module; release at any time.", "9:59")
            : new ReleaseRule("Release when the seconds digits equal unsolved modules modulo 60 (" + unsolved % 60 + ").", time((int) (unsolved % 60)));
    }

    private static ReleaseRule morseRule(BombEntity bomb, char letter) {
        int value = letter - 'A' + 1, original = value;
        if (bomb.isIndicatorLit("BOB")) value += 11;
        if (bomb.getBatteryCount() > 0) value += 19;
        if (bomb.hasPort(PortType.USB) || bomb.hasPort(PortType.SERIAL)) value += 3;
        if (bomb.serialHasVowel()) value += 20;
        if (bomb.getIndicators().values().stream().noneMatch(lit -> !lit)) value += 39;
        if (bomb.isIndicatorLit("FRK")) value += 32;
        if (bomb.getModules().stream().anyMatch(candidate -> candidate.getType() == ModuleType.FORGET_ME_NOT || candidate.getType() == ModuleType.FORGET_EVERYTHING)) value += 50;
        if (value == original) value++;
        int suffix = Math.floorMod(value, 60);
        return new ReleaseRule("Release when the seconds digits show " + String.format("%02d", suffix) + ".", time(suffix));
    }

    private static String latestMultiple(int divisor) { int total = 599 - 599 % divisor; return total / 60 + ":" + String.format("%02d", total % 60); }
    private static String time(int seconds) { return "9:" + String.format("%02d", seconds); }
    private static String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
    private static String display(String value) { String lower = value.toLowerCase(Locale.ROOT); return Character.toUpperCase(lower.charAt(0)) + lower.substring(1); }
    private record TapRule(String condition, String time) {}
    private record ReleaseRule(String condition, String time) {}
}
