package ktanesolver.module.modded.regular.plungerbutton;
import ktanesolver.logic.ModuleOutput;
public record PlungerButtonOutput(int solvedModules,int pressDigit,int releaseDigit) implements ModuleOutput {}
