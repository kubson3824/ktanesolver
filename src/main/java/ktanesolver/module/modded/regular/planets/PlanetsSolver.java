package ktanesolver.module.modded.regular.planets;

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
    type = ModuleType.PLANETS, id = "planets", name = "Planets",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Calculate the six-digit planetary code from the planet, strips, solved modules, and edgework.",
    tags = {"planets", "strips", "arithmetic", "edgework"}
)
public class PlanetsSolver extends AbstractModuleSolver<PlanetsInput, PlanetsOutput> {
    public static final List<String> PLANETS = List.of("Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Other");
    public static final List<String> COLORS = List.of("Aqua", "Blue", "Green", "Lime", "Orange", "Red", "Yellow", "White", "Off");
    private static final int[][] CHANGE_ONE = {
        {0,-3,-5,2,-9,-8,-6,1,-4},{5,6,2,6,-7,-4,3,-8,3},{6,-2,-8,-5,4,8,4,2,-1},
        {-6,7,-4,-5,-4,-4,-5,-3,8},{7,-5,3,-7,6,1,-4,4,-9},{-5,-9,-2,-1,3,-9,-7,-5,-9},
        {-2,-1,9,-9,-2,5,5,-8,0},{-1,8,3,8,6,-2,4,4,8},{-2,9,-3,-6,-4,2,4,-3,-1}
    };
    private static final int[] CHANGE_TWO = {89,30,41,97,49,63,60,3,74};

    @Override
    protected SolveResult<PlanetsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PlanetsInput input) {
        if (input == null || input.stripColors() == null || input.stripColors().size() != 5) return failure("Enter all five strip colors");
        int planetIndex = indexIgnoreCase(PLANETS, input.planet());
        if (planetIndex < 0) return failure("Choose a valid planet");
        int[] strips = new int[5];
        for (int i = 0; i < 5; i++) {
            strips[i] = indexIgnoreCase(COLORS, input.stripColors().get(i));
            if (strips[i] < 0) return failure("Choose valid strip colors");
        }
        if (input.productFactorOne() < 1 || input.productFactorTwo() < 1) return failure("The two rule-seed factors must be positive");

        int solved = (int) bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
        int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
        int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
        int numberA = (planetIndex + 1) * 123 + solved * 10;
        int numberB = bomb.getBatteryCount() * 5 + lit * 6;
        int numberC = (numberA + numberB + 4 * ports + input.productFactorOne() * input.productFactorTwo()) % 1000;
        int product = 1;
        for (int strip : strips) product *= strip + 1;
        int numberD = ((product + CHANGE_ONE[strips[0]][strips[3]]) * CHANGE_TWO[strips[2]] * (strips[4] > 6 ? 5 : 1)) % 1000;
        String code = String.format("%06d", Math.abs(numberC * numberD) % 1_000_000);

        storeState(module, "planetsPlanet", PLANETS.get(planetIndex));
        storeState(module, "planetsStripColors", input.stripColors().stream().map(value -> COLORS.get(indexIgnoreCase(COLORS, value))).toList());
        return success(new PlanetsOutput(numberA, numberB, numberC, numberD, code));
    }

    private static int indexIgnoreCase(List<String> values, String value) {
        if (value == null) return -1;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        for (int i = 0; i < values.size(); i++) if (values.get(i).toLowerCase(Locale.ROOT).equals(normalized)) return i;
        return -1;
    }
}
