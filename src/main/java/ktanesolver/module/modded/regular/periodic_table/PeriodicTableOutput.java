package ktanesolver.module.modded.regular.periodic_table;

import ktanesolver.logic.ModuleOutput;

public record PeriodicTableOutput(
	int atomicNumber,
	String elementName,
	String symbol,
	int elementTerm,
	int symbolTerm,
	int numberTerm,
	int buttonTerm,
	int total
) implements ModuleOutput {}
