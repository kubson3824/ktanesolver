package ktanesolver.module.modded.regular.thedealmaker;

import java.math.BigDecimal;
import ktanesolver.logic.ModuleOutput;

public record DealmakerOutput(boolean goodDeal, String action, BigDecimal goodsValueEur, BigDecimal offerValueEur) implements ModuleOutput {}
