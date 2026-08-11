package ktanesolver.module.modded.regular.functions;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FunctionsOutput(
	Integer queryFunctionNumber,
	String queryFunction,
	Integer finalFunctionNumber,
	String finalFunction,
	Long answer,
	List<Integer> candidateFunctionNumbers,
	List<Integer> suggestedQuery
) implements ModuleOutput {}
