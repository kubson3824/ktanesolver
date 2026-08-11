package ktanesolver.module.modded.regular.dividedsquares;
import ktanesolver.logic.ModuleOutput;
public record DividedSquaresOutput(String square,String action,Integer targetSolvedModules,boolean anySolveCount,int matchingPairs)implements ModuleOutput{}
