package ktanesolver.module.modded.regular.passportcontrol;

import java.util.ArrayList;
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
    type = ModuleType.PASSPORT_CONTROL,
    id = "passportControl",
    name = "Passport Control",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Approve or deny three passengers using the bomb-encoded daily rules.",
    tags = {"passport", "dates", "inspection", "memory", "stages"}
)
public class PassportControlSolver extends AbstractModuleSolver<PassportControlInput, PassportControlOutput> {
    @Override
    protected SolveResult<PassportControlOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, PassportControlInput input
    ) {
        if (input == null || input.successfulPassages() < 0 || input.successfulPassages() > 2) return failure("Successful passages must be between 0 and 2");
        String flight = input.flightType() == null ? "" : input.flightType().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ARRIVAL", "DEPARTURE").contains(flight)) return failure("Select arrival or departure");
        if (!validDate(input.birthDay(), input.birthMonth(), input.birthYear()) || !validDate(input.expirationDay(), input.expirationMonth(), input.expirationYear())) {
            return failure("Enter valid displayed birth and expiration date values");
        }
        String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
        if (serial.length() != 6) return failure("A six-character serial number is required");
        int[] ruleDate = ruleDate(serial);
        boolean allPass = bomb.isIndicatorLit("BOB") && bomb.isIndicatorLit("CAR") && bomb.isIndicatorLit("NSA");
        boolean allDeny = !allPass && bomb.isIndicatorUnlit("BOB") && bomb.isIndicatorLit("CAR") && bomb.hasPort(PortType.PS2);
        List<String> restrictions = new ArrayList<>(), reasons = new ArrayList<>();
        boolean approve = true;
        if (allPass) {
            restrictions.add("All passengers pass");
            reasons.add("Important-people exception");
        } else if (allDeny) {
            restrictions.add("No passengers pass");
            reasons.add("Facility lockdown");
            approve = false;
        } else {
            String requiredFlight = requiredFlight(bomb);
            if (requiredFlight != null) {
                restrictions.add(requiredFlight.equals("ARRIVAL") ? "Arrivals only" : "Departures only");
                if (!requiredFlight.equals(flight)) { approve = false; reasons.add("Wrong travel direction"); }
            }
            long arstotzkaLetters = serial.chars().filter(character -> "ARSTOZKA".indexOf(character) >= 0).count();
            if (arstotzkaLetters >= 3) {
                restrictions.add("Arstotzkans only");
                if (!input.arstotzkan()) { approve = false; reasons.add("Not Arstotzkan"); }
            }
            int digitSum = serial.chars().filter(Character::isDigit).map(character -> character - '0').sum();
            if (digitSum >= 18) {
                restrictions.add("Age 18 or older");
                if (compare(ruleDate, new int[]{input.birthDay(), input.birthMonth(), input.birthYear() + 18}) < 0) {
                    approve = false; reasons.add("Passenger is under 18");
                }
            }
            if (compare(new int[]{input.expirationDay(), input.expirationMonth(), input.expirationYear()}, ruleDate) < 0) {
                approve = false; reasons.add("Passport is expired");
            }
            if (approve) reasons.add("All active rules are satisfied");
        }
        String date = ruleDate[0] + "/" + ruleDate[1] + "/" + ruleDate[2];
        PassportControlOutput output = new PassportControlOutput(date, List.copyOf(restrictions), approve ? "APPROVE" : "DENY", List.copyOf(reasons), input.successfulPassages() + 1);
        return success(output, input.successfulPassages() == 2);
    }

    private static int[] ruleDate(String serial) {
        int day = value(serial.charAt(0)) % 3 * 10 + value(serial.charAt(1)) % 10;
        if (day == 0) day = 1;
        int month = (value(serial.charAt(2)) + value(serial.charAt(3))) % 12 + 1;
        int year = 2000 + ((value(serial.charAt(4)) % 10 * 10 + value(serial.charAt(5)) % 10) % 30);
        return new int[]{day, month, year};
    }

    private static String requiredFlight(BombEntity bomb) {
        boolean combinedPlate = bomb.getPortPlates().stream().anyMatch(plate -> plate.getPorts().contains(PortType.PARALLEL) && plate.getPorts().contains(PortType.SERIAL));
        if (bomb.getBatteryCount() >= 3 && combinedPlate) return "ARRIVAL";
        if (bomb.getBatteryCount() <= 2 && bomb.isIndicatorLit("SND")) return "DEPARTURE";
        return null;
    }

    private static int value(char character) {
        return Character.isDigit(character) ? character - '0' : character - 'A' + 1;
    }

    private static boolean validDate(int day, int month, int year) {
        return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1800 && year <= 2200;
    }

    private static int compare(int[] first, int[] second) {
        if (first[2] != second[2]) return Integer.compare(first[2], second[2]);
        if (first[1] != second[1]) return Integer.compare(first[1], second[1]);
        return Integer.compare(first[0], second[0]);
    }
}
