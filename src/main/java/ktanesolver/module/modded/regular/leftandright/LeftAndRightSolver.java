package ktanesolver.module.modded.regular.leftandright;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.BooleanSupplier;
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
    type = ModuleType.LEFT_AND_RIGHT,
    id = "leftandRight",
    name = "Left and Right",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Build the binary left/right sequence and account for dynamic direction switches.",
    tags = {"left", "right", "binary", "buttons", "switching"}
)
public class LeftAndRightSolver extends AbstractModuleSolver<LeftAndRightInput, LeftAndRightOutput> {
    @Override
    protected SolveResult<LeftAndRightOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, LeftAndRightInput input
    ) {
        String greenSide = input == null || input.greenButtonSide() == null ? "" : input.greenButtonSide().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("LEFT", "RIGHT").contains(greenSide)) return failure("Select whether the green button is on the left or right");
        String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
        if (serial.chars().noneMatch(Character::isDigit)) return failure("The bomb serial number needs a digit");

        int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
        int plates = bomb.getPortPlates().size();
        int lastDigit = serial.chars().filter(Character::isDigit).map(character -> character - '0').reduce((a, b) -> b).orElse(0);
        StringBuilder number = new StringBuilder().append((lastDigit * lastDigit * lastDigit) % 8);
        if (ports != plates) number.append((int) (Math.pow(ports + plates, 4) % 4));
        else number.append(bomb.getDBatteryCount()).append(serial.chars().filter(Character::isLetter).count());
        int batteryCount = bomb.getBatteryCount(), holders = bomb.getBatteryHolders();
        long lit = bomb.getIndicators().values().stream().filter(Boolean::booleanValue).count();
        long unlit = bomb.getIndicators().size() - lit;
        if (batteryCount == holders) number.append((int) (((lit - unlit) * (lit - unlit)) % 6));
        else number.append(batteryCount + holders);
        String binary = new BigInteger(number.toString()).toString(2);

        int[] switches = switchValues(bomb, serial, ports, plates, lit, unlit);
        int greenSwitch = switches[0], blueSwitch = switches[1];
        int leftSwitch = greenSide.equals("LEFT") ? greenSwitch : blueSwitch;
        int rightSwitch = greenSide.equals("RIGHT") ? greenSwitch : blueSwitch;
        List<String> presses = simulate(binary, leftSwitch, rightSwitch);
        return success(new LeftAndRightOutput(number.toString(), binary, greenSwitch, blueSwitch, presses));
    }

    private static int[] switchValues(BombEntity bomb, String serial, int ports, int plates, long lit, long unlit) {
        if (bomb.isIndicatorLit("FRK") && bomb.isIndicatorUnlit("NSA")
            && bomb.hasPort(PortType.PS2) && bomb.hasPort(PortType.PARALLEL) && bomb.hasPort(PortType.SERIAL)
            && bomb.hasPort(PortType.RJ45) && bomb.hasPort(PortType.DVI) && !bomb.hasPort(PortType.STEREO_RCA)) return new int[]{-1, -1};
        List<Integer> values = new ArrayList<>(2);
        List<BooleanSupplier> conditions = List.of(
            () -> lit > unlit,
            () -> serial.chars().anyMatch(character -> "AEIOU".indexOf(character) >= 0),
            () -> bomb.getBatteryHolders() + plates + bomb.getIndicators().size() <= 5,
            () -> bomb.getModules().size() >= 5,
            () -> serial.chars().filter(Character::isDigit).count() == serial.chars().filter(Character::isLetter).count());
        int[] thresholds = {3, 2, 4, 1, 2};
        for (int index = 0; index < conditions.size() && values.size() < 2; index++) if (conditions.get(index).getAsBoolean()) values.add(thresholds[index]);
        while (values.size() < 2) values.add(3);
        return new int[]{values.get(0), values.get(1)};
    }

    private static List<String> simulate(String binary, int leftSwitch, int rightSwitch) {
        String remaining = binary;
        int leftCount = 0, rightCount = 0;
        List<String> presses = new ArrayList<>(binary.length());
        while (!remaining.isEmpty()) {
            boolean left = remaining.charAt(0) == '0';
            presses.add(left ? "LEFT" : "RIGHT");
            remaining = remaining.substring(1);
            if (remaining.isEmpty()) break;
            if (left && ++leftCount == leftSwitch) { remaining = invert(remaining); leftCount = 0; }
            if (!left && ++rightCount == rightSwitch) { remaining = invert(remaining); rightCount = 0; }
        }
        return List.copyOf(presses);
    }

    private static String invert(String value) {
        StringBuilder result = new StringBuilder(value.length());
        for (char character : value.toCharArray()) result.append(character == '0' ? '1' : '0');
        return result.toString();
    }
}
