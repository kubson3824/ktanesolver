package ktanesolver.module.modded.regular.micromodules;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record MicroModulesInput(
    Integer directionalKeypadsId,
    Integer codeMorseId,
    Integer scriptWiresId,
    Integer mathCodeId,
    String microSerial,
    List<MicroIndicator> microIndicators,
    String microBatteryColor,
    List<String> arrows,
    String rendererName,
    List<String> wireColors,
    String receivedMorseDigits,
    String mathLetters,
    String firstOperator,
    String secondOperator
) implements ModuleInput {
    public record MicroIndicator(String label, boolean lit) {}
}
