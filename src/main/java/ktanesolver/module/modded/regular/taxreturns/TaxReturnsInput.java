package ktanesolver.module.modded.regular.taxreturns;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TaxReturnsInput(
	List<Integer> turnovers,
	List<Integer> expenses,
	String surnameFirstLetter,
	String niLastLetter,
	Integer payrollLastDigit
) implements ModuleInput {}
