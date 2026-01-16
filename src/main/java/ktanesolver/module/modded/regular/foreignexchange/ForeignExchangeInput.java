
package ktanesolver.module.modded.regular.foreignexchange;

import ktanesolver.logic.ModuleInput;

public record ForeignExchangeInput(String baseCurrency, String targetCurrency, String amount, boolean hasGreenLights) implements ModuleInput {
}
