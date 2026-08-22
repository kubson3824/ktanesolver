package ktanesolver.module.modded.regular.thedealmaker;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.thedealmaker.DealmakerInput.DealKind;

@Service
@ModuleInfo(
	type = ModuleType.THE_DEALMAKER,
	id = "thedealmaker",
	name = "The Dealmaker",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine whether a buy or sell offer turns a profit.",
	tags = {"money", "currency", "conversion", "math"}
)
public class TheDealmakerSolver extends AbstractModuleSolver<DealmakerInput, DealmakerOutput> {
	@Override
	protected SolveResult<DealmakerOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, DealmakerInput input) {
		if (input == null || input.kind() == null || input.quantity() == null || input.unit() == null || input.item() == null || input.price() == null || input.currency() == null)
			return failure("Enter every part of the displayed deal");
		if (input.quantity().compareTo(BigDecimal.ZERO) <= 0) return failure("Quantity must be positive");
		if (input.price().compareTo(BigDecimal.ZERO) < 0) return failure("Price cannot be negative");
		if (input.unit().countable != input.item().countable) return failure("Select an amount unit for countable items or a weight unit for materials");
		if (input.item().countable && input.quantity().stripTrailingZeros().scale() > 0) return failure("Countable-item quantities must be whole numbers");

		BigDecimal goodsValue = input.quantity().multiply(input.unit().factor).multiply(input.item().valueEur);
		BigDecimal offerValue = input.price().multiply(input.currency().valueEur);
		boolean goodDeal = input.kind() == DealKind.BUY ? offerValue.compareTo(goodsValue) < 0 : offerValue.compareTo(goodsValue) >= 0;
		return success(new DealmakerOutput(goodDeal, goodDeal ? "deal" : "nodeal", goodsValue.stripTrailingZeros(), offerValue.stripTrailingZeros()), goodDeal);
	}
}
