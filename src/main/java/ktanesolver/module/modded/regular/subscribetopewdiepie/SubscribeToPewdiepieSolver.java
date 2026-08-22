package ktanesolver.module.modded.regular.subscribetopewdiepie;

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
    type = ModuleType.SUBSCRIBE_TO_PEWDIEPIE,
    id = "subscribeToPewdiepie",
    name = "Subscribe to Pewdiepie",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Apply the bomb's modules, batteries, and serial number to the displayed subscriber counts.",
    tags = {"pewdiepie", "t-series", "subscriber gap", "numbers"}
)
public class SubscribeToPewdiepieSolver extends AbstractModuleSolver<SubscribeToPewdiepieInput, SubscribeToPewdiepieOutput> {
    @Override
    protected SolveResult<SubscribeToPewdiepieOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SubscribeToPewdiepieInput input
    ) {
        if (input == null) return failure("Enter both displayed subscriber counts");
        if (!eightDigits(input.pewdiepieSubscribers()) || !eightDigits(input.tSeriesSubscribers())) {
            return failure("Subscriber counts must each contain exactly eight digits");
        }
        if (bomb.getSerialNumber() == null || bomb.getSerialNumber().isBlank()) {
            return failure("Enter the bomb serial number first");
        }

        int pewdiepie = Math.max(input.pewdiepieSubscribers(), input.tSeriesSubscribers());
        int tSeries = Math.min(input.pewdiepieSubscribers(), input.tSeriesSubscribers());

        for (ModuleEntity candidate : bomb.getModules()) {
            if (candidate.getType() == ModuleType.T_WORDS) tSeries += 500;
            if (candidate.getType() == ModuleType.PIE) pewdiepie += 500;
        }
        pewdiepie += bomb.getModules().size() * 10;

        if (hasModule(bomb, ModuleType.ONE_HUNDRED_AND_ONE_DALMATIANS) && hasModule(bomb, ModuleType.COOKING)) {
            tSeries -= Math.abs(pewdiepie - tSeries);
        }
        for (int battery = 0; battery < bomb.getBatteryCount(); battery++) {
            pewdiepie = (int) (pewdiepie * 0.95d);
        }
        if (bomb.getSerialNumber().toUpperCase().matches(".*[TSERI].*")) {
            tSeries = (int) (tSeries * 1.5d);
        }

        int gap = Math.max(0, pewdiepie - tSeries);
        String submission = gap == 0 ? "00000" : "%05d".formatted(gap % 100_000);
        storeState(module, "subscribePewdiepieStartingPewdiepie", input.pewdiepieSubscribers());
        storeState(module, "subscribePewdiepieStartingTSeries", input.tSeriesSubscribers());
        return success(new SubscribeToPewdiepieOutput(
            input.pewdiepieSubscribers(), input.tSeriesSubscribers(), pewdiepie, tSeries, gap, submission
        ));
    }

    private static boolean eightDigits(int value) { return value >= 10_000_000 && value <= 99_999_999; }
    private static boolean hasModule(BombEntity bomb, ModuleType type) {
        return bomb.getModules().stream().anyMatch(candidate -> candidate.getType() == type);
    }
}
