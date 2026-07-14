package ktanesolver.module.modded.regular.cheapcheckout;

import java.math.BigDecimal;

import ktanesolver.logic.ModuleOutput;

public record CheapCheckoutOutput(
	BigDecimal total,
	BigDecimal paidAmount,
	BigDecimal change,
	boolean needsSecondPayment,
	String instruction
) implements ModuleOutput {}
