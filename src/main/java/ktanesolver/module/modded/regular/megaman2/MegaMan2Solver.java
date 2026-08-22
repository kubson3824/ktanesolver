package ktanesolver.module.modded.regular.megaman2;

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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(type = ModuleType.MEGA_MAN_2, id = "megaMan2", name = "Mega Man 2",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Build the nine-point Mega Man 2 password from the shown master, weapon, and bomb edgework.",
    tags = {"mega man", "password", "grid", "edgework"})
public class MegaMan2Solver extends AbstractModuleSolver<MegaMan2Input, MegaMan2Output> {
    public static final List<String> MASTERS = List.of("Air Man", "Bubble Man", "Crash Man", "Flash Man", "Heat Man", "Metal Man", "Quick Man", "Wood Man");
    private static final String[] DEAD = {"B2","D5","D4","C5","C1","B4","C3","E2"};
    private static final String[] ALIVE = {"E1","D2","B1","B3","E4","E5","D3","C4"};

    @Override protected SolveResult<MegaMan2Output> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MegaMan2Input input) {
        if (input == null || input.displayedMaster() == null || input.displayedWeapon() == null)
            return failure("Choose the displayed robot master and weapon");
        int shown = master(input.displayedMaster()), weapon = master(input.displayedWeapon());
        if (shown < 0 || weapon < 0 || shown == weapon) return failure("The displayed master and weapon must be different valid masters");
        if (input.startingMinutes() < 1) return failure("Enter the bomb's starting time in minutes");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");
        int digitSum = serial.chars().filter(Character::isDigit).map(c -> c - '0').sum();
        int eTanks = Math.floorMod(digitSum - 1, 5) + 1;
        int firstDigit = serial.chars().filter(Character::isDigit).map(c -> c - '0').findFirst().orElse(0);
        boolean[] alive = {
            bomb.getBatteryHolders() >= bomb.getIndicators().size(),
            eTanks != 2,
            bomb.hasIndicator("CAR"),
            bomb.getLastDigit() <= 5,
            bomb.getModules().size() >= 11,
            bomb.getBatteryCount() == firstDigit,
            bomb.hasPort(PortType.RJ45),
            input.startingMinutes() >= 40
        };
        alive[shown] = true; alive[weapon] = false;
        List<String> password = new ArrayList<>();
        password.add("A" + eTanks);
        for (int i = 0; i < MASTERS.size(); i++) password.add(alive[i] ? ALIVE[i] : DEAD[i]);
        return success(new MegaMan2Output(eTanks, List.copyOf(password)));
    }

    private static int master(String value) {
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        for (int i = 0; i < MASTERS.size(); i++) if (MASTERS.get(i).toLowerCase(Locale.ROOT).equals(normalized)) return i;
        return -1;
    }
}
