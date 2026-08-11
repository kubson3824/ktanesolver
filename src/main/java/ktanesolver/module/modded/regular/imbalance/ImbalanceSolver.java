package ktanesolver.module.modded.regular.imbalance;

import java.util.Locale;
import java.util.Set;
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
    type = ModuleType.IMBALANCE,
    id = "imbalance",
    name = "Imbalance",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Decode two imbalanced-negabinary bars and multiply their values.",
    tags = {"math", "binary", "timer"}
)
public class ImbalanceSolver extends AbstractModuleSolver<ImbalanceInput, ImbalanceOutput> {
    private static final Set<String> MARKERS = Set.of("LEFT", "RIGHT");

    @Override
    protected SolveResult<ImbalanceOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ImbalanceInput input
    ) {
        if (input == null || input.topMarker() == null || input.topDigits() == null
            || input.bottomMarker() == null || input.bottomDigits() == null) {
            return failure("Enter both displayed bars");
        }
        String topMarker = input.topMarker().trim().toUpperCase(Locale.ROOT);
        String bottomMarker = input.bottomMarker().trim().toUpperCase(Locale.ROOT);
        String topDigits = input.topDigits().trim();
        String bottomDigits = input.bottomDigits().trim();
        if (!MARKERS.contains(topMarker) || !MARKERS.contains(bottomMarker)) {
            return failure("Each bar marker must point left or right");
        }
        if (!topDigits.matches("[12]{0,7}") || !bottomDigits.matches("[12]{0,7}")) {
            return failure("Each bar may contain up to seven digits, using only 1 and 2");
        }
        int topValue = decode(topMarker, topDigits);
        int bottomValue = decode(bottomMarker, bottomDigits);
        if (topValue > 127 || bottomValue > 127) {
            return failure("The displayed bars must decode to values from 0 through 127");
        }
        return success(new ImbalanceOutput(topValue, bottomValue, topValue * bottomValue));
    }

    static int decode(String marker, String digits) {
        if (digits.isEmpty()) return marker.equals("LEFT") ? 0 : 1;
        int binary = 0;
        for (int index = 0; index < digits.length(); index++) {
            int positionFromRight = digits.length() - index;
            char digit = digits.charAt(index);
            boolean one = positionFromRight % 2 == 1 ? digit == '2' : digit == '1';
            binary = binary * 2 + (one ? 1 : 0);
        }
        return binary + 1;
    }
}
